import { beforeEach, describe, expect, it } from 'vitest'
import { fakeBrowser } from 'wxt/testing/fake-browser'

import type { FakePihole } from '@/test/fake-pihole'
import { HOME, instance, OFFICE, seedSettings, simulateWorkerRestart, twoPiholes } from '@/test/helpers'

import { ALARM_STATUS } from './alarms'
import {
  bootstrap,
  handleAlarm,
  handleCommand,
  handleInstalled,
  HOTKEYS,
  registerMessageHandlers
} from './background-handlers'
import { removeAllListeners, sendMessage } from './messaging'
import { migratedItem, settingsItem } from './settings/storage'
import { stateItem } from './state'

describe('background handlers', () => {
  let home: FakePihole
  let office: FakePihole

  beforeEach(async () => {
    simulateWorkerRestart()
    removeAllListeners()
    ;({ home, office } = twoPiholes())
    await seedSettings([instance(HOME), instance(OFFICE)])
    registerMessageHandlers()
  })

  it('answers messages from the pages', async () => {
    const state = await sendMessage('refresh', undefined)
    expect(state.overall).toBe('enabled')

    const result = await sendMessage('setBlocking', { enabled: false, seconds: 30 })
    expect(result.ok).toBe(true)
    expect(home.timer).toBe(30)

    const site = await sendMessage('getSiteStatus', { hostname: 'news.example.com' })
    expect(site.verdict).toBe('not-blocked')

    expect(await sendMessage('getState', undefined)).toMatchObject({ overall: 'paused' })
  })

  it('bootstrap sets up the alarm and context menu and refreshes', async () => {
    await bootstrap()
    expect(await fakeBrowser.alarms.get(ALARM_STATUS)).toBeTruthy()
    expect((await stateItem.getValue()).overall).toBe('enabled')
    const menus = (fakeBrowser as unknown as { contextMenus: { create: { mock: { calls: unknown[] } } } }).contextMenus
      .create
    expect(menus.mock.calls.length).toBeGreaterThan(0)
  })

  it('migrates v4 storage on update', async () => {
    await settingsItem.removeValue()
    await fakeBrowser.storage.local.set({
      pi_hole_settings: [{ pi_uri_base: `${HOME}/admin`, api_key: 'secret' }],
      default_disable_time: 30,
      'session_storage_http://pi.hole': { value: 'stale-sid' }
    })

    await handleInstalled({ reason: 'update', previousVersion: '4.0.4' })

    const settings = await settingsItem.getValue()
    expect(settings.instances.map((i) => i.url)).toEqual([HOME])
    expect(settings.pause.defaultSeconds).toBe(30)
    expect(await migratedItem.getValue()).toMatchObject({ from: '4.0.4' })
    expect(home.requestsTo('/auth', 'DELETE').map((r) => r.sid)).toEqual(['stale-sid'])
    expect((await stateItem.getValue()).overall).toBe('enabled')
  })

  it('migrates once when the worker start, onInstalled and onStartup overlap', async () => {
    await settingsItem.removeValue()
    await fakeBrowser.storage.local.set({
      pi_hole_settings: [{ pi_uri_base: `${HOME}/admin`, api_key: 'secret' }]
    })

    await Promise.all([bootstrap(), handleInstalled({ reason: 'update', previousVersion: '4.0.4' }), bootstrap()])

    expect((await settingsItem.getValue()).instances).toHaveLength(1)
    expect(await migratedItem.getValue()).toMatchObject({ from: '4.0.4', instances: 1 })
    const removeAll = (fakeBrowser as unknown as { contextMenus: { removeAll: { mock: { calls: unknown[] } } } })
      .contextMenus.removeAll
    expect(removeAll.mock.calls).toHaveLength(1)
    expect((await stateItem.getValue()).overall).toBe('enabled')
  })

  it('runs hotkeys through the same actions', async () => {
    await fakeBrowser.tabs.create({ url: 'https://ads.example.com/x', active: true })
    await handleCommand(HOTKEYS.deny)
    expect(home.domains.map((d) => [d.type, d.domain])).toEqual([['deny', 'ads.example.com']])
    await handleCommand(HOTKEYS.allow)
    expect(home.domains.map((d) => d.type)).toEqual(['allow'])
    await handleCommand(HOTKEYS.toggle)
    expect(office.blocking).toBe('disabled')
  })

  it('refreshes on the status alarm', async () => {
    await handleAlarm(ALARM_STATUS)
    expect(home.requestsTo('/dns/blocking')).toHaveLength(1)
  })
})
