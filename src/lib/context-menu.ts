import { i18n } from '#i18n'
import { browser } from '#imports'

export const MENU_IDS = {
  toggle: 'pihole-switch-toggle',
  deny: 'pihole-switch-deny',
  allow: 'pihole-switch-allow',
  settings: 'pihole-switch-settings'
} as const

export type MenuId = (typeof MENU_IDS)[keyof typeof MENU_IDS]

/** Rebuilds the page context menu, or removes it when the setting is off. */
export async function syncContextMenu(enabled: boolean): Promise<void> {
  await browser.contextMenus.removeAll()
  if (!enabled) return
  const contexts: ['page'] = ['page']
  browser.contextMenus.create({ id: MENU_IDS.toggle, title: i18n.t('contextMenu.toggle'), contexts })
  browser.contextMenus.create({ id: 'pihole-switch-sep-1', type: 'separator', contexts })
  browser.contextMenus.create({ id: MENU_IDS.deny, title: i18n.t('contextMenu.deny'), contexts })
  browser.contextMenus.create({ id: MENU_IDS.allow, title: i18n.t('contextMenu.allow'), contexts })
  browser.contextMenus.create({ id: 'pihole-switch-sep-2', type: 'separator', contexts })
  browser.contextMenus.create({ id: MENU_IDS.settings, title: i18n.t('contextMenu.openSettings'), contexts })
}
