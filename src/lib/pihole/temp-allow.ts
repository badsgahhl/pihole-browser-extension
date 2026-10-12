import { storage } from '#imports'
import { clearTempAllowAlarm, scheduleTempAllowExpiry } from '@/lib/alarms'
import { deleteDomain } from '@/lib/api/pihole'
import { readSettings } from '@/lib/settings/storage'
import { reloadCurrentTab } from '@/lib/tabs'

import { PiholeError, toErrorData } from './errors'
import { type InstanceContext, resolveContexts } from './instances'
import { withSession } from './session'
import {
  _addExactForTests as addExact,
  _searchOnForTests as searchOn,
  classify,
  getSiteStatus,
  invalidateSiteCache,
  type SiteMutationResult,
  TEMP_COMMENT_PREFIX
} from './site-status'

export interface TempAllowEntry {
  id: string
  hostname: string
  createdAt: number
  expiresAt: number
  /** Instances that received the temporary entry. */
  instanceIds: string[]
  /** Failed expiry attempts so far. */
  attempts: number
}

export const tempAllowItem = storage.defineItem<TempAllowEntry[]>('local:tempAllow', { fallback: [] })

const MAX_EXPIRY_ATTEMPTS = 10
const RETRY_DELAY_MS = 60_000

export function tempAllowComment(expiresAt: number): string {
  return `${TEMP_COMMENT_PREFIX}${new Date(expiresAt).toISOString()}`
}

/**
 * Allows a hostname for a while on every Pi-hole that does not already allow it permanently, and
 * schedules the removal. The entry carries its expiry in the comment so it survives an extension
 * reinstall and can be told apart from the user's own entries.
 */
export async function tempAllow(hostname: string, minutes?: number): Promise<SiteMutationResult> {
  const settings = await readSettings()
  const contexts = await resolveContexts(settings)
  const expiresAt = Date.now() + (minutes ?? settings.tempAllowMinutes) * 60_000
  const comment = tempAllowComment(expiresAt)

  const results = await Promise.allSettled(
    contexts.map(async (ctx) => {
      const current = classify(await searchOn(ctx, hostname))
      const permanent = current.allow.some(
        (entry) => entry.kind === 'exact' && !entry.comment?.startsWith(TEMP_COMMENT_PREFIX)
      )
      if (permanent) return false
      for (const entry of current.allow.filter((e) => e.kind === 'exact' && e.domain === hostname)) {
        // Replace an older temporary entry so the new expiry applies.
        try {
          await withSession(ctx, (o) =>
            deleteDomain({ ...o, path: { type: 'allow', kind: 'exact', domain: entry.domain } })
          )
        } catch (error) {
          if (!(error instanceof PiholeError && error.kind === 'not_found')) throw error
        }
      }
      await addExact(ctx, 'allow', hostname, comment)
      return true
    })
  )

  const instanceIds = contexts
    .filter((_, index) => results[index]?.status === 'fulfilled' && results[index]?.value === true)
    .map((ctx) => ctx.id)
  if (instanceIds.length > 0) {
    const entry: TempAllowEntry = {
      id: crypto.randomUUID(),
      hostname,
      createdAt: Date.now(),
      expiresAt,
      instanceIds,
      attempts: 0
    }
    const existing = (await tempAllowItem.getValue()).filter((e) => e.hostname !== hostname)
    await tempAllowItem.setValue([...existing, entry])
    await scheduleTempAllowExpiry(entry.id, expiresAt)
  }

  await invalidateSiteCache(hostname)
  const status = await getSiteStatus(hostname, { fresh: true })
  const perInstance = results.map((result, index) => {
    const id = contexts[index]!.id
    return result.status === 'fulfilled' ? { id, ok: true } : { id, ok: false, error: toErrorData(result.reason, id) }
  })
  const ok = perInstance.every((entry) => entry.ok)
  if (ok && settings.reloadAfterAllow) void reloadCurrentTab(1500, settings)
  return { ok, perInstance, status }
}

async function removeTempEntry(ctx: InstanceContext, hostname: string): Promise<void> {
  const current = classify(await searchOn(ctx, hostname))
  for (const entry of current.allow) {
    if (entry.kind !== 'exact' || entry.domain !== hostname) continue
    // The user may have made it permanent in the meantime; only temporary entries go.
    if (!entry.comment?.startsWith(TEMP_COMMENT_PREFIX)) continue
    try {
      await withSession(ctx, (o) =>
        deleteDomain({ ...o, path: { type: 'allow', kind: 'exact', domain: entry.domain } })
      )
    } catch (error) {
      if (!(error instanceof PiholeError && error.kind === 'not_found')) throw error
    }
  }
}

/** Removes an expired temporary entry from its Pi-holes. Retries later on transport failures. */
export async function expireTempAllow(id: string): Promise<void> {
  const entries = await tempAllowItem.getValue()
  const entry = entries.find((e) => e.id === id)
  if (!entry) return

  const settings = await readSettings()
  const contexts = (await resolveContexts(settings)).filter((ctx) => entry.instanceIds.includes(ctx.id))
  const results = await Promise.allSettled(contexts.map((ctx) => removeTempEntry(ctx, entry.hostname)))
  const failed = results.some((result) => result.status === 'rejected')

  if (failed && entry.attempts + 1 < MAX_EXPIRY_ATTEMPTS) {
    await tempAllowItem.setValue(entries.map((e) => (e.id === id ? { ...e, attempts: e.attempts + 1 } : e)))
    await scheduleTempAllowExpiry(id, Date.now() + RETRY_DELAY_MS)
  } else {
    await tempAllowItem.setValue(entries.filter((e) => e.id !== id))
    await clearTempAllowAlarm(id)
  }
  await invalidateSiteCache(entry.hostname)
}

/** On startup: expire what is overdue and make sure every pending entry has its alarm. */
export async function cleanupTempAllows(): Promise<void> {
  const entries = await tempAllowItem.getValue()
  const now = Date.now()
  for (const entry of entries) {
    if (entry.expiresAt <= now) await expireTempAllow(entry.id)
    else await scheduleTempAllowExpiry(entry.id, entry.expiresAt)
  }
}

/** Forgets a pending temporary entry, e.g. after the user removed the domain by hand. */
export async function forgetTempAllow(hostname: string): Promise<void> {
  const entries = await tempAllowItem.getValue()
  const gone = entries.filter((e) => e.hostname === hostname)
  if (gone.length === 0) return
  await tempAllowItem.setValue(entries.filter((e) => e.hostname !== hostname))
  for (const entry of gone) await clearTempAllowAlarm(entry.id)
}
