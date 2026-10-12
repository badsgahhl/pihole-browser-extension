import { storage } from '#imports'
import { addDomain, deleteDomain, getSearch, type Search } from '@/lib/api/pihole'
import { readSettings } from '@/lib/settings/storage'
import { reloadCurrentTab } from '@/lib/tabs'

import { PiholeError, type PiholeErrorData, toErrorData } from './errors'
import { type InstanceContext, resolveContexts } from './instances'
import { withSession } from './session'

export type SiteVerdict =
  | 'allowed-own'
  | 'allowed-temp'
  | 'allowed-list'
  | 'blocked-own'
  | 'blocked-list'
  | 'not-blocked'
  | 'unknown'

export type ListType = 'allow' | 'deny'

export interface OwnEntry {
  list: ListType
  kind: 'exact' | 'regex'
  id: number
  domain: string
  comment: string | null
  addedAt: number | null
}

export interface SiteInstanceResult {
  id: string
  ok: boolean
  error?: PiholeErrorData
  allow: OwnEntry[]
  deny: OwnEntry[]
}

export interface SiteStatus {
  hostname: string
  verdict: SiteVerdict
  /** Name of the blocklist or allowlist that matched, for the `*-list` verdicts. */
  listName: string | null
  /** The extension user's own entry that decides the verdict, if any. */
  ownEntry: OwnEntry | null
  /** Epoch ms when a temporary allow entry expires. */
  tempUntil: number | null
  perInstance: SiteInstanceResult[]
  checkedAt: number
}

export interface SiteMutationResult {
  ok: boolean
  perInstance: Array<{ id: string; ok: boolean; error?: PiholeErrorData }>
  status: SiteStatus
}

export const ENTRY_COMMENT = 'Pi-hole Switch'
export const TEMP_COMMENT_PREFIX = 'Pi-hole Switch · temporary until '

const CACHE_TTL_MS = 30_000

export const siteCacheItem = storage.defineItem<Record<string, SiteStatus>>('session:siteCache', { fallback: {} })

type SearchPayload = NonNullable<Search['search']>
type SearchDomain = NonNullable<SearchPayload['domains']>[number]
type SearchGravity = NonNullable<SearchPayload['gravity']>[number]

const GENERIC_LIST_NAMES = new Set([
  'hosts',
  'hosts.txt',
  'list',
  'list.txt',
  'domains',
  'domains.txt',
  'blocklist',
  'blocklist.txt',
  'adlist',
  'default',
  'master',
  'main',
  'raw'
])

/** A readable name for a gravity list: its comment, else the telling part of its URL. */
/** Comments Pi-hole writes itself when it imports the default list; they say nothing about the list. */
const AUTOMATIC_COMMENT = /^migrated from /i

export function deriveListName(entry: Pick<SearchGravity, 'address' | 'comment'>): string {
  const comment = entry.comment?.trim()
  if (comment && !AUTOMATIC_COMMENT.test(comment)) return comment.slice(0, 40)
  const address = entry.address ?? ''
  try {
    const url = new URL(address)
    const segments = url.pathname.split('/').filter(Boolean)
    const last = segments.at(-1)
    if (!last) return url.hostname
    if (GENERIC_LIST_NAMES.has(last.toLowerCase())) {
      const previous = [...segments]
        .reverse()
        .find((segment, index) => index > 0 && !GENERIC_LIST_NAMES.has(segment.toLowerCase()))
      const stem = last.replace(/\.[a-z0-9]+$/i, '')
      return (previous ? `${previous} ${stem}` : `${url.hostname} ${stem}`).slice(0, 40)
    }
    return last.replace(/\.[a-z0-9]+$/i, '').slice(0, 40)
  } catch {
    return address.slice(0, 40) || 'list'
  }
}

export function tempUntilFromComment(comment: string | null | undefined): number | null {
  if (!comment?.startsWith(TEMP_COMMENT_PREFIX)) return null
  const parsed = Date.parse(comment.slice(TEMP_COMMENT_PREFIX.length))
  return Number.isNaN(parsed) ? null : parsed
}

function toOwnEntry(entry: SearchDomain): OwnEntry | null {
  if (entry.type !== 'allow' && entry.type !== 'deny') return null
  if (entry.kind !== 'exact' && entry.kind !== 'regex') return null
  if (typeof entry.id !== 'number' || typeof entry.domain !== 'string') return null
  return {
    list: entry.type,
    kind: entry.kind,
    id: entry.id,
    domain: entry.domain,
    comment: entry.comment ?? null,
    addedAt: typeof entry.date_added === 'number' ? entry.date_added * 1000 : null
  }
}

export interface Classification {
  verdict: SiteVerdict
  listName: string | null
  ownEntry: OwnEntry | null
  tempUntil: number | null
  allow: OwnEntry[]
  deny: OwnEntry[]
}

/** Decides what Pi-hole does with a domain from one `/search` answer. Pure. */
export function classify(search: SearchPayload | undefined): Classification {
  const entries = (search?.domains ?? []).filter((entry) => entry.enabled !== false)
  const own = entries.map(toOwnEntry).filter((entry): entry is OwnEntry => entry !== null)
  // Exact entries win over regex ones; among equals the newest entry decides.
  const sorted = [...own].sort((a, b) =>
    a.kind === b.kind ? (b.addedAt ?? 0) - (a.addedAt ?? 0) : a.kind === 'exact' ? -1 : 1
  )
  const allow = sorted.filter((entry) => entry.list === 'allow')
  const deny = sorted.filter((entry) => entry.list === 'deny')
  const gravity = (search?.gravity ?? []).filter((entry) => entry.enabled !== false)

  if (allow.length > 0) {
    const entry = allow[0]!
    const tempUntil = tempUntilFromComment(entry.comment)
    return {
      verdict: tempUntil ? 'allowed-temp' : 'allowed-own',
      listName: null,
      ownEntry: entry,
      tempUntil,
      allow,
      deny
    }
  }
  if (deny.length > 0) {
    return { verdict: 'blocked-own', listName: null, ownEntry: deny[0]!, tempUntil: null, allow, deny }
  }
  const allowList = gravity.find((entry) => entry.type === 'allow')
  if (allowList) {
    return {
      verdict: 'allowed-list',
      listName: deriveListName(allowList),
      ownEntry: null,
      tempUntil: null,
      allow,
      deny
    }
  }
  const blockList = gravity.find((entry) => entry.type === 'block')
  if (blockList) {
    return {
      verdict: 'blocked-list',
      listName: deriveListName(blockList),
      ownEntry: null,
      tempUntil: null,
      allow,
      deny
    }
  }
  return { verdict: 'not-blocked', listName: null, ownEntry: null, tempUntil: null, allow, deny }
}

async function searchOn(ctx: InstanceContext, hostname: string): Promise<SearchPayload> {
  const data = await withSession(ctx, (o) =>
    getSearch({ ...o, path: { domain: hostname }, query: { partial: false, N: 20 } })
  )
  return data.search ?? {}
}

async function statusFromInstances(hostname: string, contexts: InstanceContext[]): Promise<SiteStatus> {
  const results = await Promise.allSettled(contexts.map((ctx) => searchOn(ctx, hostname)))
  const perInstance: SiteInstanceResult[] = []
  let decided: Classification | null = null

  for (const [index, result] of results.entries()) {
    const ctx = contexts[index]!
    if (result.status === 'fulfilled') {
      const classification = classify(result.value)
      decided ??= classification
      perInstance.push({ id: ctx.id, ok: true, allow: classification.allow, deny: classification.deny })
    } else {
      perInstance.push({ id: ctx.id, ok: false, error: toErrorData(result.reason, ctx.id), allow: [], deny: [] })
    }
  }

  return {
    hostname,
    verdict: decided?.verdict ?? 'unknown',
    listName: decided?.listName ?? null,
    ownEntry: decided?.ownEntry ?? null,
    tempUntil: decided?.tempUntil ?? null,
    perInstance,
    checkedAt: Date.now()
  }
}

export async function invalidateSiteCache(hostname?: string): Promise<void> {
  if (hostname === undefined) {
    await siteCacheItem.setValue({})
    return
  }
  const cache = await siteCacheItem.getValue()
  if (!(hostname in cache)) return
  const { [hostname]: _dropped, ...rest } = cache
  await siteCacheItem.setValue(rest)
}

/** What all configured Pi-holes do with this hostname, cached for a short while. */
export async function getSiteStatus(hostname: string, options: { fresh?: boolean } = {}): Promise<SiteStatus> {
  const cache = await siteCacheItem.getValue()
  const cached = cache[hostname]
  if (!options.fresh && cached && Date.now() - cached.checkedAt < CACHE_TTL_MS) return cached

  const settings = await readSettings()
  const contexts = await resolveContexts(settings)
  const status = await statusFromInstances(hostname, contexts)
  if (status.verdict !== 'unknown') await siteCacheItem.setValue({ ...cache, [hostname]: status })
  return status
}

async function deleteEntries(ctx: InstanceContext, entries: OwnEntry[]): Promise<void> {
  for (const entry of entries) {
    try {
      await withSession(ctx, (o) =>
        deleteDomain({ ...o, path: { type: entry.list, kind: entry.kind, domain: entry.domain } })
      )
    } catch (error) {
      if (!(error instanceof PiholeError && error.kind === 'not_found')) throw error
    }
  }
}

async function addExact(ctx: InstanceContext, list: ListType, hostname: string, comment: string): Promise<void> {
  try {
    const data = await withSession(ctx, (o) =>
      addDomain({
        ...o,
        path: { type: list, kind: 'exact' },
        body: { domain: hostname, comment, groups: [0], enabled: true }
      })
    )
    const failed = data.processed?.errors?.find((entry) => entry.item === hostname)
    if (failed && !/already present|UNIQUE/i.test(failed.error ?? '')) {
      throw new PiholeError({ kind: 'bad_request', instanceId: ctx.id, message: failed.error ?? 'Rejected by Pi-hole' })
    }
  } catch (error) {
    if (!(error instanceof PiholeError && error.kind === 'duplicate')) throw error
  }
}

/** Exact entries for this hostname on the opposite list get removed first, as v4 did. */
async function mutateOnAll(
  hostname: string,
  mutate: (ctx: InstanceContext, current: Classification) => Promise<void>
): Promise<SiteMutationResult> {
  const settings = await readSettings()
  const contexts = await resolveContexts(settings)
  const results = await Promise.allSettled(
    contexts.map(async (ctx) => {
      const current = classify(await searchOn(ctx, hostname))
      await mutate(ctx, current)
    })
  )
  await invalidateSiteCache(hostname)
  const status = await getSiteStatus(hostname, { fresh: true })
  const perInstance = results.map((result, index) => {
    const id = contexts[index]!.id
    return result.status === 'fulfilled' ? { id, ok: true } : { id, ok: false, error: toErrorData(result.reason, id) }
  })
  return { ok: perInstance.every((entry) => entry.ok), perInstance, status }
}

function exactEntries(entries: OwnEntry[], hostname: string): OwnEntry[] {
  return entries.filter((entry) => entry.kind === 'exact' && entry.domain === hostname)
}

export async function allowDomain(hostname: string): Promise<SiteMutationResult> {
  const result = await mutateOnAll(hostname, async (ctx, current) => {
    await deleteEntries(ctx, exactEntries(current.deny, hostname))
    await addExact(ctx, 'allow', hostname, ENTRY_COMMENT)
  })
  if (result.ok) {
    const settings = await readSettings()
    if (settings.reloadAfterAllow) void reloadCurrentTab(1500, settings)
  }
  return result
}

export async function denyDomain(hostname: string): Promise<SiteMutationResult> {
  return mutateOnAll(hostname, async (ctx, current) => {
    await deleteEntries(ctx, exactEntries(current.allow, hostname))
    await addExact(ctx, 'deny', hostname, ENTRY_COMMENT)
  })
}

export async function removeDomain(hostname: string, list: ListType): Promise<SiteMutationResult> {
  return mutateOnAll(hostname, async (ctx, current) => {
    await deleteEntries(ctx, exactEntries(list === 'allow' ? current.allow : current.deny, hostname))
  })
}

export { addExact as _addExactForTests, searchOn as _searchOnForTests }
