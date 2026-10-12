import { DEFAULT_SETTINGS, MAX_INSTANCES, SETTINGS_VERSION } from './defaults'
import { InvalidUrlError, instanceHostname, normalizeInstanceUrl } from './url'

export type BadgeMode = 'off' | 'state' | 'percent'
export type Theme = 'system' | 'light' | 'dark'

export interface Instance {
  id: string
  name: string
  /** Canonical URL, see `normalizeInstanceUrl`. */
  url: string
  /** Admin or app password. Empty when the Pi-hole has no password. */
  password: string
}

export interface PauseSettings {
  /** Seconds. `0` pauses until blocking is enabled again. */
  defaultSeconds: number
  rememberLast: boolean
}

export interface Settings {
  version: typeof SETTINGS_VERSION
  instances: Instance[]
  pause: PauseSettings
  reloadAfterPause: boolean
  reloadAfterAllow: boolean
  showCurrentSite: boolean
  contextMenu: boolean
  badgeMode: BadgeMode
  theme: Theme
  tempAllowMinutes: number
  requestTimeoutMs: number
}

const BADGE_MODES: readonly BadgeMode[] = ['off', 'state', 'percent']
const THEMES: readonly Theme[] = ['system', 'light', 'dark']

export class SettingsValidationError extends Error {
  readonly path: string

  constructor(path: string, message: string) {
    super(`${path}: ${message}`)
    this.name = 'SettingsValidationError'
    this.path = path
  }
}

function fail(path: string, message: string): never {
  throw new SettingsValidationError(path, message)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readBoolean(source: Record<string, unknown>, key: string, fallback: boolean): boolean {
  const value = source[key]
  if (value === undefined) return fallback
  if (typeof value !== 'boolean') fail(key, 'must be true or false')
  return value
}

function readInteger(
  source: Record<string, unknown>,
  key: string,
  fallback: number,
  { min, max }: { min: number; max: number }
): number {
  const value = source[key]
  if (value === undefined) return fallback
  if (typeof value !== 'number' || !Number.isFinite(value)) fail(key, 'must be a number')
  const rounded = Math.round(value)
  if (rounded < min || rounded > max) fail(key, `must be between ${min} and ${max}`)
  return rounded
}

function readEnum<T extends string>(
  source: Record<string, unknown>,
  key: string,
  fallback: T,
  allowed: readonly T[]
): T {
  const value = source[key]
  if (value === undefined) return fallback
  if (typeof value !== 'string' || !allowed.includes(value as T)) fail(key, `must be one of ${allowed.join(', ')}`)
  return value as T
}

export function newInstanceId(): string {
  return crypto.randomUUID()
}

function validateInstance(value: unknown, index: number): Instance {
  const path = `instances[${index}]`
  if (!isRecord(value)) fail(path, 'must be an object')

  if (typeof value.url !== 'string') fail(`${path}.url`, 'must be a string')
  let url: string
  try {
    url = normalizeInstanceUrl(value.url)
  } catch (error) {
    fail(`${path}.url`, error instanceof InvalidUrlError ? error.reason : 'invalid')
  }

  if (value.name !== undefined && typeof value.name !== 'string') fail(`${path}.name`, 'must be a string')
  const name = (value.name ?? '').trim().slice(0, 40) || instanceHostname(url)

  if (value.password !== undefined && typeof value.password !== 'string') {
    fail(`${path}.password`, 'must be a string')
  }
  if (value.id !== undefined && (typeof value.id !== 'string' || value.id === '')) {
    fail(`${path}.id`, 'must be a non-empty string')
  }

  return {
    id: typeof value.id === 'string' ? value.id : newInstanceId(),
    name,
    url,
    password: typeof value.password === 'string' ? value.password : ''
  }
}

/**
 * Checks an untrusted object (import file, message payload, stored value) and returns a complete
 * `Settings`. Missing keys take the value from `base`; present keys must have the right shape.
 * Throws `SettingsValidationError` with the offending path.
 */
export function validateSettings(input: unknown, base: Settings = DEFAULT_SETTINGS): Settings {
  if (!isRecord(input)) fail('settings', 'must be an object')

  let instances = base.instances
  if (input.instances !== undefined) {
    if (!Array.isArray(input.instances)) fail('instances', 'must be a list')
    if (input.instances.length > MAX_INSTANCES) fail('instances', `at most ${MAX_INSTANCES} Pi-holes`)
    instances = input.instances.map(validateInstance)
    const seen = new Set<string>()
    for (const [index, instance] of instances.entries()) {
      const key = instance.url.toLowerCase()
      if (seen.has(key)) fail(`instances[${index}].url`, 'is configured twice')
      seen.add(key)
    }
  }

  let pause = base.pause
  if (input.pause !== undefined) {
    if (!isRecord(input.pause)) fail('pause', 'must be an object')
    pause = {
      defaultSeconds: readInteger(input.pause, 'defaultSeconds', base.pause.defaultSeconds, {
        min: 0,
        max: 7 * 24 * 3600
      }),
      rememberLast: readBoolean(input.pause, 'rememberLast', base.pause.rememberLast)
    }
  }

  return {
    version: SETTINGS_VERSION,
    instances,
    pause,
    reloadAfterPause: readBoolean(input, 'reloadAfterPause', base.reloadAfterPause),
    reloadAfterAllow: readBoolean(input, 'reloadAfterAllow', base.reloadAfterAllow),
    showCurrentSite: readBoolean(input, 'showCurrentSite', base.showCurrentSite),
    contextMenu: readBoolean(input, 'contextMenu', base.contextMenu),
    badgeMode: readEnum(input, 'badgeMode', base.badgeMode, BADGE_MODES),
    theme: readEnum(input, 'theme', base.theme, THEMES),
    tempAllowMinutes: readInteger(input, 'tempAllowMinutes', base.tempAllowMinutes, { min: 1, max: 24 * 60 }),
    requestTimeoutMs: readInteger(input, 'requestTimeoutMs', base.requestTimeoutMs, { min: 1000, max: 120_000 })
  }
}

/** Applies a partial update on top of complete settings. `pause` merges, everything else replaces. */
export function mergeSettings(base: Settings, partial: Partial<Settings>): Settings {
  return validateSettings(
    {
      ...partial,
      pause: partial.pause ? { ...base.pause, ...partial.pause } : undefined
    },
    base
  )
}
