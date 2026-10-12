import { describe, expect, it } from 'vitest'

import { DEFAULT_SETTINGS } from './defaults'
import { parseSettingsExport, serializeSettings } from './export'
import { SettingsValidationError, validateSettings } from './schema'

describe('settings export', () => {
  const settings = validateSettings({
    instances: [{ id: 'home', name: 'Home', url: 'http://192.168.178.20:9802', password: 'pw' }],
    theme: 'dark'
  })

  it('round trips through the file format', () => {
    const json = serializeSettings(settings, new Date('2026-10-12T08:00:00Z'))
    expect(JSON.parse(json)).toMatchObject({
      app: 'pihole-browser-extension',
      exportVersion: 1,
      exportedAt: '2026-10-12T08:00:00.000Z'
    })
    expect(parseSettingsExport(json)).toEqual(settings)
  })

  it('accepts a bare settings object and assigns missing ids', () => {
    const parsed = parseSettingsExport(JSON.stringify({ instances: [{ url: 'pi.hole/admin' }] }))
    expect(parsed.instances[0]).toMatchObject({ url: 'http://pi.hole', name: 'pi.hole' })
    expect(parsed.instances[0]?.id).toBeTruthy()
    expect(parsed.theme).toBe(DEFAULT_SETTINGS.theme)
  })

  it.each([
    ['not json', 'file'],
    ['[]', 'file'],
    [JSON.stringify({ app: 'something-else', settings: {} }), 'file'],
    [JSON.stringify({ settings: { instances: [{ url: 'ftp://x' }] } }), 'instances[0].url']
  ])('rejects %s', (json, path) => {
    expect(() => parseSettingsExport(json)).toThrow(SettingsValidationError)
    expect(() => parseSettingsExport(json)).toThrow(expect.objectContaining({ path }))
  })
})
