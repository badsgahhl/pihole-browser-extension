import { beforeEach, describe, expect, it } from 'vitest'
import { fakeBrowser } from 'wxt/testing/fake-browser'

import { ALARM_PAUSE_END } from '@/lib/alarms'
import { lastPauseItem, settingsItem } from '@/lib/settings/storage'
import { stateItem } from '@/lib/state'
import type { FakePihole } from '@/test/fake-pihole'
import {
  HOME,
  instance,
  OFFICE,
  permissionsMock,
  seedSettings,
  simulateWorkerRestart,
  twoPiholes
} from '@/test/helpers'

import { extendPause, refreshAll, saveSettings, setBlocking, testInstance, toggle } from './actions'

describe('actions', () => {
  let home: FakePihole
  let office: FakePihole

  beforeEach(async () => {
    simulateWorkerRestart()
    ;({ home, office } = twoPiholes())
    await seedSettings([instance(HOME), instance(OFFICE)])
  })

  describe('refreshAll', () => {
    it('publishes the combined state, the badge and caches versions', async () => {
      home.messagesCount = 2
      const state = await refreshAll('startup')

      expect(state.overall).toBe('enabled')
      expect(state.instances.map((i) => i.blocking)).toEqual(['enabled', 'enabled'])
      expect(state.instances[0]?.versions?.core).toBe('v6.4.2')
      expect(state.messagesCount).toBe(2)
      expect(await stateItem.getValue()).toEqual(state)
      expect(await fakeBrowser.action.getBadgeText({})).toBe('badge_on')

      await refreshAll('alarm')
      expect(home.requestsTo('/info/version')).toHaveLength(1)
      expect(home.requestsTo('/dns/blocking')).toHaveLength(2)
    })

    it('fetches stats for the popup and keeps per-instance errors', async () => {
      office.failAll('network')
      const state = await refreshAll('popup')
      expect(state.overall).toBe('enabled')
      expect(state.degraded).toBe(true)
      expect(state.instances[1]?.error?.kind).toBe('unreachable')
      expect(state.instances[0]?.stats?.clients).toBe(24)
      expect(state.clients).toBe(24)
    })

    it('shares one run between concurrent callers', async () => {
      await Promise.all([refreshAll('popup'), refreshAll('alarm'), refreshAll('manual')])
      expect(home.requestsTo('/dns/blocking')).toHaveLength(1)
    })

    it('fetches again when a pause lands while it is in flight', async () => {
      await refreshAll('startup')
      home.delayWhen((_method, path) => path === '/dns/blocking', 60)
      office.delayWhen((_method, path) => path === '/dns/blocking', 60)

      const refreshing = refreshAll('alarm')
      await new Promise((resolve) => setTimeout(resolve, 10))
      await setBlocking({ enabled: false, seconds: 300 })
      const state = await refreshing

      expect(state.overall).toBe('paused')
      expect((await stateItem.getValue()).overall).toBe('paused')
    })

    it('does not retry a refused password on the minute alarm', async () => {
      home.password = 'other'
      await refreshAll('startup')
      expect(home.requestsTo('/auth', 'POST')).toHaveLength(1)

      const state = await refreshAll('alarm')
      expect(state.instances[0]?.error?.kind).toBe('unauthorized')
      expect(home.requestsTo('/auth', 'POST')).toHaveLength(1)

      await refreshAll('popup')
      expect(home.requestsTo('/auth', 'POST')).toHaveLength(2)
    })
  })

  describe('setBlocking', () => {
    it('pauses every Pi-hole with a timer and schedules the resume', async () => {
      const before = Date.now()
      const result = await setBlocking({ enabled: false, seconds: 300 })

      expect(result.ok).toBe(true)
      expect(home.blocking).toBe('disabled')
      expect(home.timer).toBe(300)
      expect(office.timer).toBe(300)
      expect(result.state.overall).toBe('paused')
      expect(result.state.timerEndsAt).toBeGreaterThanOrEqual(before + 300_000)
      expect(await lastPauseItem.getValue()).toBe(300)
      expect(await fakeBrowser.action.getBadgeText({})).toBe('5m')
      expect(await fakeBrowser.alarms.get(ALARM_PAUSE_END)).toBeTruthy()
    })

    it('pauses indefinitely for 0 and resumes with enabled', async () => {
      await setBlocking({ enabled: false, seconds: 0 })
      expect(home.timer).toBeNull()
      expect((await stateItem.getValue()).pausedIndefinitely).toBe(true)
      expect(await fakeBrowser.action.getBadgeText({})).toBe('badge_off')

      const result = await setBlocking({ enabled: true })
      expect(home.blocking).toBe('enabled')
      expect(result.state.overall).toBe('enabled')
      expect(await fakeBrowser.alarms.get(ALARM_PAUSE_END)).toBeUndefined()
    })

    it('uses the remembered duration, else the default', async () => {
      await setBlocking({ enabled: false })
      expect(home.timer).toBe(300)
      await lastPauseItem.setValue(45)
      await setBlocking({ enabled: false })
      expect(home.timer).toBe(45)

      const settings = await settingsItem.getValue()
      await settingsItem.setValue({ ...settings, pause: { defaultSeconds: 60, rememberLast: false } })
      await setBlocking({ enabled: false })
      expect(home.timer).toBe(60)
    })

    it('reports a failing Pi-hole but applies the change to the rest', async () => {
      office.failAll('network')
      const result = await setBlocking({ enabled: false, seconds: 10 })
      expect(result.ok).toBe(false)
      expect(result.perInstance.map((p) => p.ok)).toEqual([true, false])
      expect(home.blocking).toBe('disabled')
      expect(result.state.overall).toBe('paused')
      expect(result.state.degraded).toBe(true)
    })
  })

  it('toggle pauses when anything blocks and resumes when everything is paused', async () => {
    await refreshAll('startup')
    await toggle()
    expect(home.blocking).toBe('disabled')
    expect(office.blocking).toBe('disabled')
    await toggle()
    expect(home.blocking).toBe('enabled')
  })

  it('extendPause adds time only to running timers', async () => {
    await setBlocking({ enabled: false, seconds: 300 })
    office.blocking = 'enabled'
    office.timer = null
    await refreshAll('manual')

    const result = await extendPause(300)

    expect(result.perInstance).toEqual([
      { id: `id:${HOME}`, ok: true },
      { id: `id:${OFFICE}`, ok: true, skipped: true }
    ])
    expect(home.timer).toBeGreaterThanOrEqual(598)
    expect(home.timer).toBeLessThanOrEqual(600)
    expect(office.blocking).toBe('enabled')
  })

  describe('testInstance', () => {
    it('reports versions and closes its session', async () => {
      const result = await testInstance({ url: `${HOME}/admin/`, password: 'secret' })
      expect(result).toMatchObject({ ok: true, reachable: true, auth: 'ok' })
      expect(result.versions?.ftl).toBe('v6.6.1')
      expect(home.sessionCount).toBe(0)
    })

    it('tells a wrong password from an unreachable host', async () => {
      expect(await testInstance({ url: HOME, password: 'nope' })).toMatchObject({
        ok: false,
        reachable: true,
        auth: 'failed',
        error: { kind: 'unauthorized' }
      })
      expect(await testInstance({ url: 'http://nowhere.invalid', password: 'x' })).toMatchObject({
        ok: false,
        reachable: false,
        error: { kind: 'unreachable' }
      })
      expect(await testInstance({ url: '::::', password: 'x' })).toMatchObject({ ok: false, reachable: false })
    })
  })

  it('testInstance hands fresh versions to the configured instance right away', async () => {
    await refreshAll('startup')
    home.versions.core = 'v6.4.3'
    await testInstance({ url: HOME, password: 'secret' })
    expect((await stateItem.getValue()).instances[0]?.versions?.core).toBe('v6.4.3')
  })

  it('saveSettings releases only the origin of a removed instance', async () => {
    await refreshAll('startup')
    const settings = await settingsItem.getValue()
    await saveSettings({ instances: settings.instances.filter((i) => i.url !== OFFICE) })
    expect(permissionsMock().remove).toHaveBeenCalledWith({ origins: ['https://office.example/*'] })

    permissionsMock().remove.mockClear()
    await saveSettings({ badgeMode: 'percent' })
    expect(permissionsMock().remove).not.toHaveBeenCalled()
  })

  it('saveSettings logs out of a changed instance and refreshes', async () => {
    await refreshAll('startup')
    expect(home.sessionCount).toBe(1)

    const settings = await settingsItem.getValue()
    const changed = settings.instances.map((i) => (i.url === HOME ? { ...i, password: 'rotated' } : i))
    home.password = 'rotated'
    const next = await saveSettings({ instances: changed })

    expect(next.instances[0]?.password).toBe('rotated')
    expect(home.requestsTo('/auth', 'DELETE')).toHaveLength(1)
    expect(home.requestsTo('/auth', 'POST')).toHaveLength(2)
    expect((await stateItem.getValue()).overall).toBe('enabled')
  })
})
