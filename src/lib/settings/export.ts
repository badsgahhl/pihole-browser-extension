import { DEFAULT_SETTINGS } from './defaults'
import { type Settings, SettingsValidationError, validateSettings } from './schema'

export const EXPORT_APP = 'pihole-browser-extension'
export const EXPORT_VERSION = 1

export interface SettingsExport {
  app: typeof EXPORT_APP
  exportVersion: typeof EXPORT_VERSION
  exportedAt: string
  settings: Settings
}

/** JSON for the settings file. It includes the Pi-hole passwords; the UI says so before exporting. */
export function serializeSettings(settings: Settings, now: Date = new Date()): string {
  const file: SettingsExport = {
    app: EXPORT_APP,
    exportVersion: EXPORT_VERSION,
    exportedAt: now.toISOString(),
    settings
  }
  return JSON.stringify(file, null, 2) + '\n'
}

/**
 * Reads a settings file. Accepts the wrapped export format and, as a courtesy, a bare settings
 * object. Everything is validated and normalized; instances without an id get a fresh one.
 */
export function parseSettingsExport(json: string): Settings {
  let data: unknown
  try {
    data = JSON.parse(json)
  } catch {
    throw new SettingsValidationError('file', 'is not valid JSON')
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new SettingsValidationError('file', 'is not a settings export')
  }

  const record = data as Record<string, unknown>
  if (record.app !== undefined && record.app !== EXPORT_APP) {
    throw new SettingsValidationError('file', 'was made by another application')
  }
  const payload = record.settings !== undefined ? record.settings : record
  return validateSettings(payload, DEFAULT_SETTINGS)
}
