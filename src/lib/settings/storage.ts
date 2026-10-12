import { storage } from '#imports'

import { DEFAULT_SETTINGS, SETTINGS_VERSION } from './defaults'
import { type Settings, SettingsValidationError, validateSettings } from './schema'

export interface MigrationMarker {
  /** Extension version the settings were migrated from, `unknown` when not reported. */
  from: string
  /** ISO timestamp. */
  at: string
  /** Number of Pi-holes carried over. */
  instances: number
}

/** The one settings object. Only the background writes it; pages read and `watch` it. */
export const settingsItem = storage.defineItem<Settings>('local:settings', {
  fallback: DEFAULT_SETTINGS,
  version: SETTINGS_VERSION
})

/** Seconds of the most recent pause, used as the next default when `pause.rememberLast` is on. */
export const lastPauseItem = storage.defineItem<number | null>('local:lastPauseSeconds', { fallback: null })

/** Set once the v4 storage keys have been migrated, so the migration never runs twice. */
export const migratedItem = storage.defineItem<MigrationMarker | null>('local:migratedFrom', { fallback: null })

/**
 * Stored settings, completed with defaults for keys added after they were saved. A value that no
 * longer validates (a rule tightened in an update) loses only the offending instance or field, not
 * every configured Pi-hole.
 */
export async function readSettings(): Promise<Settings> {
  const stored = await settingsItem.getValue()
  try {
    return validateSettings(stored)
  } catch (error) {
    if (!(error instanceof SettingsValidationError)) return DEFAULT_SETTINGS
    return salvage(stored)
  }
}

function salvage(stored: unknown): Settings {
  if (typeof stored !== 'object' || stored === null) return DEFAULT_SETTINGS
  const raw = stored as Record<string, unknown>
  const instances = Array.isArray(raw.instances)
    ? raw.instances.filter((entry) => {
        try {
          validateSettings({ instances: [entry] })
          return true
        } catch {
          return false
        }
      })
    : []
  const fields: Record<string, unknown> = { instances }
  for (const [key, value] of Object.entries(raw)) {
    if (key === 'instances' || key === 'version') continue
    try {
      validateSettings({ [key]: value })
      fields[key] = value
    } catch {
      // The default takes over for this one field.
    }
  }
  try {
    return validateSettings(fields)
  } catch {
    return DEFAULT_SETTINGS
  }
}

export async function writeSettings(next: Settings): Promise<void> {
  await settingsItem.setValue(validateSettings(next))
}
