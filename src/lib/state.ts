import { storage } from '#imports'
import type { PiholeErrorData } from '@/lib/pihole/errors'
import type { Instance } from '@/lib/settings/schema'

export type BlockingState = 'enabled' | 'disabled' | 'failed' | 'unknown'

export interface InstanceVersions {
  core: string | null
  web: string | null
  ftl: string | null
  docker: string | null
  updateAvailable: boolean
}

export interface InstanceStats {
  queries: number
  blocked: number
  percentBlocked: number
  clients: number
}

export interface InstanceStatus {
  id: string
  name: string
  url: string
  permissionGranted: boolean
  noAuth: boolean
  blocking: BlockingState | null
  /** Epoch ms when a running pause ends, `null` when permanent or not paused. */
  timerEndsAt: number | null
  error: PiholeErrorData | null
  lastOkAt: number | null
  versions: InstanceVersions | null
  versionsAt: number | null
  messagesCount: number | null
  messagesAt: number | null
  stats: InstanceStats | null
  statsAt: number | null
}

export type OverallState = 'needs-setup' | 'needs-permission' | 'error' | 'enabled' | 'paused' | 'mixed'

export interface TempAllowSummary {
  hostname: string
  expiresAt: number
}

export interface ExtensionState {
  version: 1
  overall: OverallState
  /** Some, not all, instances are failing. */
  degraded: boolean
  instances: InstanceStatus[]
  /** Latest pause end across instances. */
  timerEndsAt: number | null
  pausedIndefinitely: boolean
  percentBlocked: number | null
  clients: number | null
  updateAvailable: boolean
  messagesCount: number | null
  tempAllows: TempAllowSummary[]
  lastRefreshAt: number
  refreshing: boolean
}

export const EMPTY_STATE: ExtensionState = {
  version: 1,
  overall: 'needs-setup',
  degraded: false,
  instances: [],
  timerEndsAt: null,
  pausedIndefinitely: false,
  percentBlocked: null,
  clients: null,
  updateAvailable: false,
  messagesCount: null,
  tempAllows: [],
  lastRefreshAt: 0,
  refreshing: false
}

/** Runtime state derived by the background. Pages read it and `watch` it; nobody else writes it. */
export const stateItem = storage.defineItem<ExtensionState>('local:state', { fallback: EMPTY_STATE })

export function emptyInstanceStatus(instance: Instance): InstanceStatus {
  return {
    id: instance.id,
    name: instance.name,
    url: instance.url,
    permissionGranted: false,
    noAuth: false,
    blocking: null,
    timerEndsAt: null,
    error: null,
    lastOkAt: null,
    versions: null,
    versionsAt: null,
    messagesCount: null,
    messagesAt: null,
    stats: null,
    statsAt: null
  }
}

export interface CombineExtras {
  tempAllows?: TempAllowSummary[]
  lastRefreshAt?: number
  refreshing?: boolean
}

function isHealthy(status: InstanceStatus): boolean {
  return status.error === null && (status.blocking === 'enabled' || status.blocking === 'disabled')
}

/** Folds per-instance statuses into the state the popup and the badge show. */
export function combine(instances: InstanceStatus[], extras: CombineExtras = {}): ExtensionState {
  const base: ExtensionState = {
    ...EMPTY_STATE,
    instances,
    tempAllows: extras.tempAllows ?? [],
    lastRefreshAt: extras.lastRefreshAt ?? Date.now(),
    refreshing: extras.refreshing ?? false
  }
  if (instances.length === 0) return base

  const healthy = instances.filter(isHealthy)
  const failing = instances.filter((status) => !isHealthy(status))
  const permissionMissing = failing.some((status) => status.error?.kind === 'permission')

  if (healthy.length === 0) {
    return { ...base, overall: permissionMissing ? 'needs-permission' : 'error' }
  }

  const paused = healthy.filter((status) => status.blocking === 'disabled')
  let overall: OverallState
  if (permissionMissing) overall = 'needs-permission'
  else if (paused.length === healthy.length) overall = 'paused'
  else if (paused.length === 0) overall = 'enabled'
  else overall = 'mixed'

  const timers = paused.map((status) => status.timerEndsAt).filter((end): end is number => end !== null)
  const withStats = healthy.find((status) => status.stats !== null)
  const messages = healthy.map((status) => status.messagesCount).filter((count): count is number => count !== null)

  return {
    ...base,
    overall,
    degraded: failing.length > 0,
    timerEndsAt: timers.length > 0 ? Math.max(...timers) : null,
    pausedIndefinitely: paused.some((status) => status.timerEndsAt === null),
    percentBlocked: withStats?.stats?.percentBlocked ?? null,
    clients: withStats?.stats?.clients ?? null,
    updateAvailable: healthy.some((status) => status.versions?.updateAvailable === true),
    messagesCount: messages.length > 0 ? messages.reduce((sum, count) => sum + count, 0) : null
  }
}

export function isStale(state: ExtensionState, maxAgeMs = 10_000, now = Date.now()): boolean {
  return now - state.lastRefreshAt > maxAgeMs
}
