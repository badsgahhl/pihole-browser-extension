import { browser } from '#imports'

import { ALARM_PAUSE_END, ALARM_STATUS, ensureStatusAlarm, tempAllowIdFromAlarm } from './alarms'
import { MENU_IDS, syncContextMenu } from './context-menu'
import { onMessage } from './messaging'
import {
  exportSettings,
  extendPause,
  importSettings,
  logoutInstance,
  refreshAll,
  refreshInBackground,
  resetSettings,
  saveSettings,
  setBlocking,
  testInstance,
  toggle
} from './pihole/actions'
import { logoutSid } from './pihole/session'
import { allowDomain, denyDomain, getSiteStatus, removeDomain } from './pihole/site-status'
import { cleanupTempAllows, expireTempAllow, tempAllow } from './pihole/temp-allow'
import { migrateFromV4 } from './settings/migrate-v4'
import { readSettings } from './settings/storage'
import { apiBaseUrl } from './settings/url'
import { isStale, stateItem } from './state'
import { getCurrentTabHostname } from './tabs'

export const HOTKEYS = {
  toggle: 'hotkey-toggle-pihole',
  deny: 'hotkey-blacklist-current-domain',
  allow: 'hotkey-whitelist-current-domain',
  settings: 'hotkey-open-settings'
} as const

export const UNINSTALL_SURVEY_URL = 'https://forms.gle/RsGUyrmB1jtsGhYQ9'

export function optionsUrl(path?: string): string {
  const base = browser.runtime.getURL('/options.html')
  return path ? `${base}#${path.startsWith('/') ? path : `/${path}`}` : base
}

export async function openOptions(path?: string): Promise<void> {
  if (!path) {
    await browser.runtime.openOptionsPage()
    return
  }
  await browser.tabs.create({ url: optionsUrl(path) })
}

async function currentHostname(): Promise<string | null> {
  return getCurrentTabHostname(await readSettings())
}

/** Registers every message handler. Must run synchronously inside `defineBackground`. */
export function registerMessageHandlers(): void {
  onMessage('getState', async () => {
    const state = await stateItem.getValue()
    if (isStale(state)) await refreshInBackground('popup')
    return state
  })
  onMessage('refresh', () => refreshAll('manual'))
  onMessage('setBlocking', ({ data }) => setBlocking(data))
  onMessage('extendPause', ({ data }) => extendPause(data.seconds))
  onMessage('toggle', () => toggle())
  onMessage('getSiteStatus', ({ data }) => getSiteStatus(data.hostname, { fresh: data.fresh }))
  onMessage('allowDomain', ({ data }) => allowDomain(data.hostname))
  onMessage('denyDomain', ({ data }) => denyDomain(data.hostname))
  onMessage('removeDomain', ({ data }) => removeDomain(data.hostname, data.list))
  onMessage('tempAllow', ({ data }) => tempAllow(data.hostname, data.minutes))
  onMessage('testInstance', ({ data }) => testInstance(data))
  onMessage('saveSettings', async ({ data }) => {
    const settings = await saveSettings(data)
    await syncContextMenu(settings.contextMenu)
    return settings
  })
  onMessage('exportSettings', () => exportSettings())
  onMessage('importSettings', async ({ data }) => {
    const settings = await importSettings(data.json)
    await syncContextMenu(settings.contextMenu)
    return settings
  })
  onMessage('resetSettings', async () => {
    const settings = await resetSettings()
    await syncContextMenu(settings.contextMenu)
    return settings
  })
  onMessage('logoutInstance', ({ data }) => logoutInstance(data.id))
  onMessage('openOptions', ({ data }) => openOptions(data.path))
  onMessage('getCurrentTabHostname', () => currentHostname())
}

export async function handleCommand(command: string): Promise<void> {
  switch (command) {
    case HOTKEYS.toggle:
      await toggle()
      break
    case HOTKEYS.deny: {
      const hostname = await currentHostname()
      if (hostname) await denyDomain(hostname)
      break
    }
    case HOTKEYS.allow: {
      const hostname = await currentHostname()
      if (hostname) await allowDomain(hostname)
      break
    }
    case HOTKEYS.settings:
      await openOptions()
      break
    default:
  }
}

export async function handleContextMenuClick(menuItemId: string | number): Promise<void> {
  switch (menuItemId) {
    case MENU_IDS.toggle:
      await handleCommand(HOTKEYS.toggle)
      break
    case MENU_IDS.deny:
      await handleCommand(HOTKEYS.deny)
      break
    case MENU_IDS.allow:
      await handleCommand(HOTKEYS.allow)
      break
    case MENU_IDS.settings:
      await handleCommand(HOTKEYS.settings)
      break
    default:
  }
}

export async function handleAlarm(name: string): Promise<void> {
  if (name === ALARM_STATUS || name === ALARM_PAUSE_END) {
    await refreshAll('alarm')
    return
  }
  const tempId = tempAllowIdFromAlarm(name)
  if (tempId) await expireTempAllow(tempId)
}

function majorOf(version: string | undefined): number {
  const major = Number(version?.split('.')[0])
  return Number.isFinite(major) ? major : 0
}

export async function handleInstalled(details: { reason: string; previousVersion?: string }): Promise<void> {
  if (details.reason === 'install') {
    await bootstrap()
    await openOptions()
    return
  }
  if (details.reason === 'update' && majorOf(details.previousVersion) < 5) {
    await migrateFromV4({
      previousVersion: details.previousVersion,
      logout: (origin, sid) => logoutSid(apiBaseUrl(origin), sid)
    })
  }
  await bootstrap()
}

/** Idempotent start-up work: migration fallback, menus, alarms, pending temporary entries, a refresh. */
export async function bootstrap(): Promise<void> {
  await migrateFromV4({ logout: (origin, sid) => logoutSid(apiBaseUrl(origin), sid) })
  const settings = await readSettings()
  await syncContextMenu(settings.contextMenu)
  await ensureStatusAlarm()
  await cleanupTempAllows()
  await refreshAll('startup')
}
