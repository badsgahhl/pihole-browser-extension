import { describe, expect, it, vi } from 'vitest'
import { fakeBrowser } from 'wxt/testing/fake-browser'

import { DEFAULT_SETTINGS } from './defaults'
import { LEGACY_KEYS, mapLegacy, migrateFromV4, readLegacy } from './migrate-v4'
import { migratedItem, settingsItem } from './storage'

const v4Storage = {
  pi_hole_settings: [
    { pi_uri_base: 'http://192.168.178.20:9802/', api_key: 'home-pass' },
    { pi_uri_base: 'https://pihole.office.example/admin', api_key: 'office-pass' },
    { pi_uri_base: '::::', api_key: 'x' },
    { pi_uri_base: '', api_key: '' }
  ],
  default_disable_time: 30,
  reload_after_disable: false,
  reload_after_white_list: true,
  disable_list_feature: true,
  disable_context_menu: false,
  disable_update_notification: true,
  beta_feature_flag: false,
  'session_storage_http://192.168.178.20:9802': { value: 'sid-home' },
  'session_storage_https://pihole.office.example': { value: 'sid-office' }
}

describe('readLegacy', () => {
  it('returns null on a fresh install', async () => {
    expect(await readLegacy()).toBeNull()
  })

  it('collects the v4 keys and session ids', async () => {
    await fakeBrowser.storage.local.set(v4Storage)
    const snapshot = await readLegacy()
    expect(snapshot?.pi_hole_settings).toHaveLength(4)
    expect(snapshot?.default_disable_time).toBe(30)
    expect(snapshot?.sessions).toEqual([
      { origin: 'http://192.168.178.20:9802', sid: 'sid-home' },
      { origin: 'https://pihole.office.example', sid: 'sid-office' }
    ])
  })
})

describe('mapLegacy', () => {
  it('maps every v4 field onto v5 settings', () => {
    const { settings, skipped } = mapLegacy({
      pi_hole_settings: v4Storage.pi_hole_settings,
      default_disable_time: 30,
      reload_after_disable: false,
      reload_after_white_list: true,
      disable_list_feature: true,
      disable_context_menu: false,
      sessions: [],
      sessionKeys: []
    })
    expect(settings.instances.map((i) => [i.name, i.url, i.password])).toEqual([
      ['192.168.178.20', 'http://192.168.178.20:9802', 'home-pass'],
      ['pihole.office.example', 'https://pihole.office.example', 'office-pass']
    ])
    expect(settings.pause).toEqual({ defaultSeconds: 30, rememberLast: true })
    expect(settings.reloadAfterPause).toBe(false)
    expect(settings.reloadAfterAllow).toBe(true)
    expect(settings.showCurrentSite).toBe(false)
    expect(settings.contextMenu).toBe(true)
    expect(skipped).toHaveLength(2)
  })

  it('falls back to defaults for missing flags and keeps 0 as indefinite', () => {
    const { settings } = mapLegacy({ pi_hole_settings: [], default_disable_time: 0, sessions: [], sessionKeys: [] })
    expect(settings.pause.defaultSeconds).toBe(0)
    expect(settings.reloadAfterPause).toBe(DEFAULT_SETTINGS.reloadAfterPause)
    expect(settings.showCurrentSite).toBe(true)
    expect(settings.contextMenu).toBe(true)
  })

  it('numbers duplicate hostnames and skips duplicate urls', () => {
    const { settings, skipped } = mapLegacy({
      pi_hole_settings: [
        { pi_uri_base: 'http://pi.hole', api_key: 'a' },
        { pi_uri_base: 'http://pi.hole:8080', api_key: 'b' },
        { pi_uri_base: 'http://pi.hole/admin', api_key: 'c' }
      ],
      sessions: [],
      sessionKeys: []
    })
    expect(settings.instances.map((i) => i.name)).toEqual(['pi.hole', 'pi.hole (2)'])
    expect(skipped).toEqual(['Pi-hole 3: duplicate of http://pi.hole'])
  })
})

describe('migrateFromV4', () => {
  it('does nothing on a fresh install', async () => {
    expect(await migrateFromV4()).toBeNull()
    expect(await settingsItem.getValue()).toEqual(DEFAULT_SETTINGS)
    expect(await migratedItem.getValue()).toBeNull()
  })

  it('migrates once, removes the legacy keys and logs stale sessions out', async () => {
    await fakeBrowser.storage.local.set(v4Storage)
    const logout = vi.fn().mockResolvedValue(undefined)

    const report = await migrateFromV4({ previousVersion: '4.0.4', logout })

    expect(report).toMatchObject({ from: '4.0.4', instances: 2, staleSessions: 2 })
    expect(report?.skipped).toHaveLength(2)
    expect(logout).toHaveBeenCalledTimes(2)
    expect(logout).toHaveBeenCalledWith('http://192.168.178.20:9802', 'sid-home')

    const settings = await settingsItem.getValue()
    expect(settings.instances).toHaveLength(2)
    expect(settings.pause.defaultSeconds).toBe(30)

    const remaining = await fakeBrowser.storage.local.get(null)
    for (const key of LEGACY_KEYS) expect(remaining).not.toHaveProperty(key)
    expect(Object.keys(remaining).filter((k) => k.startsWith('session_storage_'))).toEqual([])
    expect(await migratedItem.getValue()).toMatchObject({ from: '4.0.4', instances: 2 })

    // A second run is a no-op even if legacy keys reappear.
    await fakeBrowser.storage.local.set({ pi_hole_settings: [{ pi_uri_base: 'http://other', api_key: '' }] })
    expect(await migrateFromV4()).toBeNull()
    expect((await settingsItem.getValue()).instances).toHaveLength(2)
  })

  it('survives a failing logout', async () => {
    await fakeBrowser.storage.local.set(v4Storage)
    const logout = vi.fn().mockRejectedValue(new Error('offline'))
    const report = await migrateFromV4({ logout })
    expect(report?.instances).toBe(2)
  })
})
