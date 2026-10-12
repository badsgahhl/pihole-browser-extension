import { browser, defineBackground } from '#imports'
import {
  bootstrap,
  handleAlarm,
  handleCommand,
  handleContextMenuClick,
  handleInstalled,
  registerMessageHandlers,
  UNINSTALL_SURVEY_URL
} from '@/lib/background-handlers'

export default defineBackground(() => {
  // Listeners first and synchronously, so a woken-up service worker never misses an event.
  registerMessageHandlers()
  browser.alarms.onAlarm.addListener((alarm) => void handleAlarm(alarm.name))
  browser.commands.onCommand.addListener((command) => void handleCommand(command))
  browser.contextMenus.onClicked.addListener((info) => void handleContextMenuClick(info.menuItemId))
  browser.runtime.onInstalled.addListener((details) => void handleInstalled(details))
  browser.runtime.onStartup.addListener(() => void bootstrap())
  void browser.runtime.setUninstallURL(UNINSTALL_SURVEY_URL)

  void bootstrap()
})
