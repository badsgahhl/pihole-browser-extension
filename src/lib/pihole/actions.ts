import { schedulePauseEnd } from '@/lib/alarms'
import { setBlocking as setBlockingRequest } from '@/lib/api/pihole'
import { applyBadge } from '@/lib/badge'
import { hasHostPermission, releaseHostPermissions } from '@/lib/permissions'
import { DEFAULT_SETTINGS } from '@/lib/settings/defaults'
import { parseSettingsExport, serializeSettings } from '@/lib/settings/export'
import { type Instance, mergeSettings, type Settings, validateSettings } from '@/lib/settings/schema'
import { lastPauseItem, readSettings, writeSettings } from '@/lib/settings/storage'
import { normalizeInstanceUrl } from '@/lib/settings/url'
import {
  combine,
  emptyInstanceStatus,
  type ExtensionState,
  type InstanceStatus,
  type InstanceVersions,
  isStale,
  stateItem
} from '@/lib/state'
import { reloadCurrentTab } from '@/lib/tabs'

import { type PiholeErrorData, toErrorData } from './errors'
import { type BlockingInfo, fetchBlocking, fetchMessagesCount, fetchStats, fetchVersions } from './info'
import { type InstanceContext, resolveContexts, toContext } from './instances'
import { dropSessionsExcept, LOGIN_BACKOFF_MS, logout, recentLoginFailure, withSession } from './session'
import { invalidateSiteCache } from './site-status'
import { tempAllowItem } from './temp-allow'

export type RefreshReason = 'alarm' | 'startup' | 'popup' | 'action' | 'manual' | 'settings'

export interface InstanceActionResult {
  id: string
  ok: boolean
  skipped?: boolean
  error?: PiholeErrorData
}

export interface ActionResult {
  ok: boolean
  perInstance: InstanceActionResult[]
  state: ExtensionState
}

export interface InstanceTestResult {
  ok: boolean
  reachable: boolean
  auth: 'ok' | 'none-needed' | 'failed'
  error?: PiholeErrorData
  versions?: InstanceVersions
}

/** The minute alarm re-reads versions once an hour; a refresh someone asked for, after five minutes. */
const VERSIONS_TTL_MS = 60 * 60_000
const VERSIONS_ASKED_TTL_MS = 5 * 60_000
const MESSAGES_TTL_MS = 10 * 60_000
/** Chrome fires a one-shot alarm no sooner than 30 s; shorter pauses end through an in-worker timeout. */
const ALARM_MIN_DELAY_MS = 30_000

let refreshInFlight: Promise<ExtensionState> | null = null
/** Bumped by every blocking action, so a refresh that overlapped one does not publish stale data over it. */
let actionSeq = 0
let shortPauseTimer: ReturnType<typeof setTimeout> | undefined

function isBackgroundReason(reason: RefreshReason): boolean {
  return reason === 'alarm' || reason === 'startup'
}

function timerEndsAt(info: BlockingInfo, now: number): number | null {
  return info.blocking === 'disabled' && info.timer !== null ? now + info.timer * 1000 : null
}

async function refreshInstance(
  ctx: InstanceContext,
  previous: InstanceStatus | undefined,
  settings: Settings,
  reason: RefreshReason,
  now: number
): Promise<InstanceStatus> {
  const status: InstanceStatus = {
    ...(previous ?? emptyInstanceStatus({ id: ctx.id, name: ctx.name, url: ctx.url, password: ctx.password })),
    id: ctx.id,
    name: ctx.name,
    url: ctx.url,
    permissionGranted: await hasHostPermission(ctx.url),
    noAuth: ctx.password === ''
  }

  if (isBackgroundReason(reason)) {
    // A refused password is not retried every minute; the popup and the settings page still may.
    const failure = await recentLoginFailure(ctx, LOGIN_BACKOFF_MS)
    if (failure) {
      status.blocking = null
      status.timerEndsAt = null
      status.error = failure
      return status
    }
  }

  try {
    const info = await fetchBlocking(ctx)
    status.blocking = info.blocking
    status.timerEndsAt = timerEndsAt(info, now)
    status.error = null
    status.lastOkAt = now
    if (info.blocking === 'failed' || info.blocking === 'unknown') {
      status.error = { kind: 'unknown', instanceId: ctx.id, message: `Pi-hole reports blocking "${info.blocking}"` }
    }
  } catch (error) {
    status.blocking = null
    status.timerEndsAt = null
    status.error = toErrorData(error, ctx.id)
    return status
  }

  const wantStats = settings.badgeMode === 'percent' || reason === 'popup' || reason === 'action'
  const versionsTtl = isBackgroundReason(reason) ? VERSIONS_TTL_MS : VERSIONS_ASKED_TTL_MS
  const tasks: Promise<void>[] = []
  if (status.versionsAt === null || now - status.versionsAt > versionsTtl) {
    tasks.push(
      fetchVersions(ctx)
        .then((versions) => {
          status.versions = versions
          status.versionsAt = now
        })
        .catch(() => undefined)
    )
  }
  if (status.messagesAt === null || now - status.messagesAt > MESSAGES_TTL_MS) {
    tasks.push(
      fetchMessagesCount(ctx)
        .then((count) => {
          status.messagesCount = count
          status.messagesAt = now
        })
        .catch(() => undefined)
    )
  }
  if (wantStats) {
    tasks.push(
      fetchStats(ctx)
        .then((stats) => {
          status.stats = stats
          status.statsAt = now
        })
        .catch(() => undefined)
    )
  }
  await Promise.all(tasks)
  return status
}

async function publish(instances: InstanceStatus[], settings: Settings, refreshing = false): Promise<ExtensionState> {
  const tempAllows = (await tempAllowItem.getValue()).map((entry) => ({
    hostname: entry.hostname,
    expiresAt: entry.expiresAt
  }))
  const state = combine(instances, { tempAllows, lastRefreshAt: Date.now(), refreshing })
  await stateItem.setValue(state)
  await applyBadge(state, settings.badgeMode)
  await schedulePauseEnd(state)
  armShortPauseTimeout(state)
  return state
}

/** Alarms cannot fire within 30 s, but the worker is still alive that long after an action. */
function armShortPauseTimeout(state: ExtensionState): void {
  clearTimeout(shortPauseTimer)
  shortPauseTimer = undefined
  const ends = state.instances
    .map((instance) => instance.timerEndsAt)
    .filter((end): end is number => end !== null && end > Date.now())
  if (ends.length === 0) return
  const delay = Math.min(...ends) - Date.now()
  if (delay < ALARM_MIN_DELAY_MS) shortPauseTimer = setTimeout(() => void refreshAll('alarm'), delay + 500)
}

/**
 * Fetches every instance's status and publishes the combined state. Concurrent calls share one run.
 * A blocking action that lands while the fetch is in flight makes the run fetch again, so the
 * action's result is never overwritten with what the Pi-holes said before it.
 */
export function refreshAll(reason: RefreshReason): Promise<ExtensionState> {
  if (refreshInFlight) return refreshInFlight
  refreshInFlight = (async () => {
    const settings = await readSettings()
    const contexts = await resolveContexts(settings)
    for (let attempt = 0; ; attempt++) {
      const seqAtStart = actionSeq
      const previous = await stateItem.getValue()
      const now = Date.now()
      const instances = await Promise.all(
        contexts.map((ctx) =>
          refreshInstance(
            ctx,
            previous.instances.find((status) => status.id === ctx.id),
            settings,
            reason,
            now
          )
        )
      )
      if (actionSeq === seqAtStart || attempt >= 2) return publish(instances, settings)
    }
  })().finally(() => {
    refreshInFlight = null
  })
  return refreshInFlight
}

/** Marks the state as refreshing so the popup can show it, then refreshes without blocking the caller. */
export async function refreshInBackground(reason: RefreshReason): Promise<void> {
  const current = await stateItem.getValue()
  if (!current.refreshing) await stateItem.setValue({ ...current, refreshing: true })
  void refreshAll(reason).catch(async () => {
    // The flag must not stick when the refresh itself blew up.
    const latest = await stateItem.getValue()
    if (latest.refreshing) await stateItem.setValue({ ...latest, refreshing: false })
  })
}

async function applyBlockingToAll(
  settings: Settings,
  body: (ctx: InstanceContext, status: InstanceStatus | undefined) => { blocking: boolean; timer: number | null } | null
): Promise<ActionResult> {
  const contexts = await resolveContexts(settings)
  const previous = await stateItem.getValue()
  const now = Date.now()

  // Results keep the configured order, whatever finishes first, so chips never jump around.
  const outcomes = await Promise.all(
    contexts.map(async (ctx): Promise<{ status: InstanceStatus; result: InstanceActionResult }> => {
      const before = previous.instances.find((status) => status.id === ctx.id)
      const status = before ?? emptyInstanceStatus({ id: ctx.id, name: ctx.name, url: ctx.url, password: ctx.password })
      const request = body(ctx, before)
      if (request === null) return { status, result: { id: ctx.id, ok: true, skipped: true } }
      try {
        const data = await withSession(ctx, (o) => setBlockingRequest({ ...o, body: request }))
        const info: BlockingInfo = {
          blocking: data.blocking ?? 'unknown',
          timer: typeof data.timer === 'number' ? data.timer : null
        }
        return {
          status: {
            ...status,
            permissionGranted: true,
            blocking: info.blocking,
            timerEndsAt: timerEndsAt(info, now),
            error: null,
            lastOkAt: now
          },
          result: { id: ctx.id, ok: true }
        }
      } catch (error) {
        const data = toErrorData(error, ctx.id)
        return {
          status: { ...status, error: data, permissionGranted: data.kind !== 'permission' },
          result: { id: ctx.id, ok: false, error: data }
        }
      }
    })
  )

  const instances = outcomes.map((outcome) => outcome.status)
  const perInstance = outcomes.map((outcome) => outcome.result)
  actionSeq++
  const state = await publish(instances, settings)
  return { ok: perInstance.every((entry) => entry.ok), perInstance, state }
}

export interface SetBlockingInput {
  enabled: boolean
  /** Pause length in seconds. `undefined` uses the remembered or default duration, `0` or `null` pauses indefinitely. */
  seconds?: number | null
}

export async function setBlocking(input: SetBlockingInput): Promise<ActionResult> {
  const settings = await readSettings()
  let timer: number | null = null
  if (!input.enabled) {
    // Pages are trusted, but NaN from a parsed field must not turn into an indefinite pause.
    let seconds = typeof input.seconds === 'number' && !Number.isFinite(input.seconds) ? undefined : input.seconds
    if (seconds === undefined) {
      const remembered = settings.pause.rememberLast ? await lastPauseItem.getValue() : null
      seconds = remembered ?? settings.pause.defaultSeconds
    }
    timer = seconds === null || seconds <= 0 ? null : Math.round(seconds)
    if (settings.pause.rememberLast && seconds !== undefined) {
      await lastPauseItem.setValue(seconds === null ? 0 : Math.max(0, Math.round(seconds)))
    }
  }

  const result = await applyBlockingToAll(settings, () => ({ blocking: input.enabled, timer }))
  if (!input.enabled && result.ok && settings.reloadAfterPause) void reloadCurrentTab(1000, settings)
  return result
}

/** Adds time to every running pause. Instances that are not paused with a timer are left alone. */
export async function extendPause(seconds: number): Promise<ActionResult> {
  const settings = await readSettings()
  const now = Date.now()
  const extra = Number.isFinite(seconds) ? Math.max(0, Math.round(seconds)) : 0
  return applyBlockingToAll(settings, (_ctx, status) => {
    if (!status || status.blocking !== 'disabled' || status.timerEndsAt === null) return null
    const remaining = Math.max(0, Math.round((status.timerEndsAt - now) / 1000))
    return { blocking: false, timer: remaining + extra }
  })
}

/** Hotkey and context menu entry point: pauses when anything blocks, resumes when everything is paused. */
export async function toggle(): Promise<ActionResult> {
  let state = await stateItem.getValue()
  // A hotkey right after the worker woke up must not act on an empty or stale picture.
  if (state.instances.length === 0 || isStale(state)) state = await refreshAll('action')
  const anyEnabled = state.instances.some((status) => status.blocking === 'enabled')
  return setBlocking({ enabled: !anyEnabled })
}

/** Tries address and password without touching the saved settings. Any session it opens is closed again. */
export async function testInstance(input: { url: string; password: string }): Promise<InstanceTestResult> {
  const settings = await readSettings()
  let url: string
  try {
    url = normalizeInstanceUrl(input.url)
  } catch (error) {
    return { ok: false, reachable: false, auth: 'failed', error: toErrorData(error) }
  }
  const instance: Instance = { id: `test:${url}`, name: url, url, password: input.password }
  const ctx = await toContext(instance, settings.requestTimeoutMs)
  try {
    const versions = await fetchVersions(ctx)
    await adoptVersions(settings, url, versions)
    return { ok: true, reachable: true, auth: ctx.password === '' ? 'none-needed' : 'ok', versions }
  } catch (error) {
    const data = toErrorData(error, ctx.id)
    const reachable = !['unreachable', 'timeout', 'permission'].includes(data.kind)
    return { ok: false, reachable, auth: 'failed', error: data }
  } finally {
    await logout(ctx)
  }
}

/** A successful test just read the versions; a configured instance with that address shows them right away. */
async function adoptVersions(settings: Settings, url: string, versions: InstanceVersions): Promise<void> {
  const state = await stateItem.getValue()
  const now = Date.now()
  let changed = false
  const instances = state.instances.map((status) => {
    if (status.url !== url) return status
    changed = true
    return { ...status, versions, versionsAt: now }
  })
  if (changed) await publish(instances, settings, state.refreshing)
}

export async function logoutInstance(id: string): Promise<void> {
  const settings = await readSettings()
  const instance = settings.instances.find((entry) => entry.id === id)
  if (!instance) return
  await logout(await toContext(instance, settings.requestTimeoutMs))
}

/** Logs out of instances that were removed or changed, prunes permissions and refreshes. */
export async function applySettingsSideEffects(previous: Settings, next: Settings): Promise<void> {
  for (const old of previous.instances) {
    const replacement = next.instances.find((instance) => instance.id === old.id)
    const changed = !replacement || replacement.url !== old.url || replacement.password !== old.password
    if (changed) await logout(await toContext(old, previous.requestTimeoutMs))
  }
  await dropSessionsExcept(next.instances.map((instance) => instance.id))
  await releaseHostPermissions(previous, next)
  await invalidateSiteCache()
  await refreshAll('settings')
}

export async function saveSettings(partial: Partial<Settings>): Promise<Settings> {
  const previous = await readSettings()
  const next = mergeSettings(previous, partial)
  await writeSettings(next)
  await applySettingsSideEffects(previous, next)
  return next
}

export async function exportSettings(): Promise<string> {
  return serializeSettings(await readSettings())
}

export async function importSettings(json: string): Promise<Settings> {
  const previous = await readSettings()
  const next = parseSettingsExport(json)
  await writeSettings(next)
  await applySettingsSideEffects(previous, next)
  return next
}

export async function resetSettings(): Promise<Settings> {
  const previous = await readSettings()
  const next = validateSettings(DEFAULT_SETTINGS)
  await writeSettings(next)
  await lastPauseItem.setValue(null)
  await applySettingsSideEffects(previous, next)
  return next
}

export function _resetActionsForTests(): void {
  refreshInFlight = null
  actionSeq = 0
  clearTimeout(shortPauseTimer)
  shortPauseTimer = undefined
}
