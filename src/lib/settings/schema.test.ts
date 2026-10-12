import { describe, expect, it } from 'vitest'

import { DEFAULT_SETTINGS, MAX_INSTANCES } from './defaults'
import { mergeSettings, SettingsValidationError, validateSettings } from './schema'

function pathOf(fn: () => unknown): string {
  try {
    fn()
  } catch (error) {
    if (error instanceof SettingsValidationError) return error.path
    throw error
  }
  throw new Error('expected a SettingsValidationError')
}

describe('validateSettings', () => {
  it('accepts the defaults unchanged', () => {
    expect(validateSettings(DEFAULT_SETTINGS)).toEqual(DEFAULT_SETTINGS)
  })

  it('fills missing keys from the base', () => {
    expect(validateSettings({})).toEqual(DEFAULT_SETTINGS)
    expect(validateSettings({ badgeMode: 'percent' })).toEqual({ ...DEFAULT_SETTINGS, badgeMode: 'percent' })
  })

  it('normalizes instances and assigns ids and names', () => {
    const result = validateSettings({
      instances: [
        { url: 'pi.hole/admin/', password: 'secret' },
        { url: 'http://10.0.0.5:9802', name: '  Garage  ' }
      ]
    })
    expect(result.instances).toHaveLength(2)
    expect(result.instances[0]).toMatchObject({ url: 'http://pi.hole', name: 'pi.hole', password: 'secret' })
    expect(result.instances[0]?.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(result.instances[1]).toMatchObject({ url: 'http://10.0.0.5:9802', name: 'Garage', password: '' })
  })

  it('keeps a given id', () => {
    const result = validateSettings({ instances: [{ id: 'abc', url: 'http://pi.hole' }] })
    expect(result.instances[0]?.id).toBe('abc')
  })

  it.each([
    [{ instances: 'nope' }, 'instances'],
    [{ instances: [{ url: 5 }] }, 'instances[0].url'],
    [{ instances: [{ url: 'ftp://x' }] }, 'instances[0].url'],
    [{ instances: [{ url: 'http://a' }, { url: 'http://A/' }] }, 'instances[1].url'],
    [{ instances: [{ url: 'http://a', id: '' }] }, 'instances[0].id'],
    [{ pause: { defaultSeconds: -1 } }, 'defaultSeconds'],
    [{ pause: { rememberLast: 'yes' } }, 'rememberLast'],
    [{ reloadAfterPause: 1 }, 'reloadAfterPause'],
    [{ badgeMode: 'rainbow' }, 'badgeMode'],
    [{ theme: 'sepia' }, 'theme'],
    [{ tempAllowMinutes: 0 }, 'tempAllowMinutes'],
    [{ requestTimeoutMs: 10 }, 'requestTimeoutMs'],
    ['text', 'settings']
  ])('rejects %j at %s', (input, path) => {
    expect(pathOf(() => validateSettings(input))).toBe(path)
  })

  it('caps the number of instances', () => {
    const instances = Array.from({ length: MAX_INSTANCES + 1 }, (_, i) => ({ url: `http://pi${i}.hole` }))
    expect(pathOf(() => validateSettings({ instances }))).toBe('instances')
  })

  it('rounds numbers', () => {
    expect(validateSettings({ pause: { defaultSeconds: 299.6 } }).pause.defaultSeconds).toBe(300)
  })
})

describe('mergeSettings', () => {
  it('merges pause and replaces everything else', () => {
    const base = { ...DEFAULT_SETTINGS, pause: { defaultSeconds: 60, rememberLast: false } }
    const merged = mergeSettings(base, { pause: { rememberLast: true } as never, theme: 'dark' })
    expect(merged.pause).toEqual({ defaultSeconds: 60, rememberLast: true })
    expect(merged.theme).toBe('dark')
    expect(merged.badgeMode).toBe(base.badgeMode)
  })

  it('replaces the instance list', () => {
    const base = validateSettings({ instances: [{ url: 'http://a' }, { url: 'http://b' }] })
    const merged = mergeSettings(base, { instances: [{ id: 'x', name: 'B', url: 'http://b', password: '' }] })
    expect(merged.instances.map((i) => i.url)).toEqual(['http://b'])
  })
})
