import type { Settings } from './schema'

export const SETTINGS_VERSION = 1

export const MAX_INSTANCES = 8

export const DEFAULT_SETTINGS: Settings = {
  version: SETTINGS_VERSION,
  instances: [],
  pause: { defaultSeconds: 300, rememberLast: true },
  reloadAfterPause: true,
  reloadAfterAllow: true,
  showCurrentSite: true,
  contextMenu: true,
  badgeMode: 'state',
  theme: 'system',
  tempAllowMinutes: 10,
  requestTimeoutMs: 10_000
}
