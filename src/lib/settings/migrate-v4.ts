import { browser } from '#imports'

import { DEFAULT_SETTINGS, MAX_INSTANCES } from './defaults'
import { type Instance, newInstanceId, type Settings } from './schema'
import { type MigrationMarker, migratedItem, writeSettings } from './storage'
import { instanceHostname, normalizeInstanceUrl } from './url'

/** Keys the v4 extension wrote to `chrome.storage.local`. */
export const LEGACY_KEYS = [
  'pi_hole_settings',
  'default_disable_time',
  'reload_after_disable',
  'reload_after_white_list',
  'disable_list_feature',
  'disable_context_menu',
  'disable_update_notification',
  'beta_feature_flag'
] as const

/** v4 cached one session id per Pi-hole origin under `session_storage_<origin>`. */
const LEGACY_SESSION_PREFIX = 'session_storage_'

export interface LegacyInstance {
  pi_uri_base?: string
  api_key?: string
}

export interface LegacySession {
  origin: string
  sid: string
}

export interface LegacySnapshot {
  pi_hole_settings?: LegacyInstance[]
  default_disable_time?: number
  reload_after_disable?: boolean
  reload_after_white_list?: boolean
  disable_list_feature?: boolean
  disable_context_menu?: boolean
  sessions: LegacySession[]
  /** Every `session_storage_*` key, including ones whose value is not what v4 wrote; all are removed. */
  sessionKeys: string[]
}

export interface MigrationReport extends MigrationMarker {
  /** Human readable notes about entries that could not be carried over. */
  skipped: string[]
  staleSessions: number
}

export interface MigrateOptions {
  previousVersion?: string
  /** Ends a v4 session on the Pi-hole so its seat is freed. Failures are ignored. */
  logout?: (origin: string, sid: string) => Promise<void>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Reads every v4 key from `storage.local`. Returns `null` when nothing from v4 is there. */
export async function readLegacy(): Promise<LegacySnapshot | null> {
  const all = (await browser.storage.local.get(null)) as Record<string, unknown>
  const sessions: LegacySession[] = []
  const sessionKeys: string[] = []
  for (const [key, value] of Object.entries(all)) {
    if (!key.startsWith(LEGACY_SESSION_PREFIX)) continue
    sessionKeys.push(key)
    const sid = isRecord(value) && typeof value.value === 'string' ? value.value : null
    if (sid) sessions.push({ origin: key.slice(LEGACY_SESSION_PREFIX.length), sid })
  }

  const hasLegacyKey = LEGACY_KEYS.some((key) => key in all)
  if (!hasLegacyKey && sessionKeys.length === 0) return null

  const instances = Array.isArray(all.pi_hole_settings)
    ? all.pi_hole_settings.filter(isRecord).map((entry) => ({
        pi_uri_base: typeof entry.pi_uri_base === 'string' ? entry.pi_uri_base : undefined,
        api_key: typeof entry.api_key === 'string' ? entry.api_key : undefined
      }))
    : undefined

  return {
    pi_hole_settings: instances,
    default_disable_time: typeof all.default_disable_time === 'number' ? all.default_disable_time : undefined,
    reload_after_disable: typeof all.reload_after_disable === 'boolean' ? all.reload_after_disable : undefined,
    reload_after_white_list: typeof all.reload_after_white_list === 'boolean' ? all.reload_after_white_list : undefined,
    disable_list_feature: typeof all.disable_list_feature === 'boolean' ? all.disable_list_feature : undefined,
    disable_context_menu: typeof all.disable_context_menu === 'boolean' ? all.disable_context_menu : undefined,
    sessions,
    sessionKeys
  }
}

/** Pure mapping of the v4 snapshot onto v5 settings. */
export function mapLegacy(
  snapshot: LegacySnapshot,
  base: Settings = DEFAULT_SETTINGS
): { settings: Settings; skipped: string[] } {
  const instances: Instance[] = []
  const skipped: string[] = []
  const usedNames = new Map<string, number>()
  const usedUrls = new Set<string>()

  for (const [index, entry] of (snapshot.pi_hole_settings ?? []).entries()) {
    const raw = entry.pi_uri_base?.trim() ?? ''
    if (raw === '') {
      skipped.push(`Pi-hole ${index + 1}: no address`)
      continue
    }
    let url: string
    try {
      url = normalizeInstanceUrl(raw)
    } catch {
      skipped.push(`Pi-hole ${index + 1}: invalid address "${raw}"`)
      continue
    }
    if (usedUrls.has(url.toLowerCase())) {
      skipped.push(`Pi-hole ${index + 1}: duplicate of ${url}`)
      continue
    }
    usedUrls.add(url.toLowerCase())
    if (instances.length >= MAX_INSTANCES) {
      skipped.push(`Pi-hole ${index + 1}: ${url} not carried over, v5 keeps up to ${MAX_INSTANCES} Pi-holes`)
      continue
    }

    const hostname = instanceHostname(url)
    const count = (usedNames.get(hostname) ?? 0) + 1
    usedNames.set(hostname, count)

    instances.push({
      id: newInstanceId(),
      name: count === 1 ? hostname : `${hostname} (${count})`,
      url,
      password: entry.api_key ?? ''
    })
  }

  const legacySeconds = snapshot.default_disable_time
  const defaultSeconds =
    typeof legacySeconds === 'number' && Number.isFinite(legacySeconds) && legacySeconds >= 0
      ? Math.round(legacySeconds)
      : base.pause.defaultSeconds

  return {
    settings: {
      ...base,
      instances,
      pause: { defaultSeconds, rememberLast: base.pause.rememberLast },
      reloadAfterPause: snapshot.reload_after_disable ?? base.reloadAfterPause,
      reloadAfterAllow: snapshot.reload_after_white_list ?? base.reloadAfterAllow,
      showCurrentSite: !(snapshot.disable_list_feature ?? false),
      contextMenu: !(snapshot.disable_context_menu ?? false)
    },
    skipped
  }
}

/**
 * Carries v4 storage over to the v5 settings object exactly once. Returns `null` when there is
 * nothing to migrate or it already happened.
 */
let migrating: Promise<MigrationReport | null> | null = null

export function migrateFromV4(options: MigrateOptions = {}): Promise<MigrationReport | null> {
  // onInstalled and the worker's bootstrap both ask at start-up; one run serves both.
  if (migrating) return migrating
  migrating = runMigration(options).finally(() => {
    migrating = null
  })
  return migrating
}

async function runMigration(options: MigrateOptions): Promise<MigrationReport | null> {
  if ((await migratedItem.getValue()) !== null) return null

  const snapshot = await readLegacy()
  if (snapshot === null) return null

  const { settings, skipped } = mapLegacy(snapshot)
  await writeSettings(settings)

  // Legacy keys (plaintext passwords among them) go before the marker: a worker dying in between
  // then re-runs a migration of nothing rather than keeping the keys forever.
  await browser.storage.local.remove([...LEGACY_KEYS, ...snapshot.sessionKeys])

  const marker: MigrationMarker = {
    from: options.previousVersion ?? 'unknown',
    at: new Date().toISOString(),
    instances: settings.instances.length
  }
  await migratedItem.setValue(marker)

  if (options.logout) {
    for (const session of snapshot.sessions) {
      try {
        await options.logout(session.origin, session.sid)
      } catch {
        // The session expires on its own; freeing the seat early is a courtesy.
      }
    }
  }

  return { ...marker, skipped, staleSessions: snapshot.sessions.length }
}
