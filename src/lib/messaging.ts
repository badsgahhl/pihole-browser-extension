import { defineExtensionMessaging } from '@webext-core/messaging'

import type { ActionResult, InstanceTestResult } from './pihole/actions'
import type { ListType, SiteMutationResult, SiteStatus } from './pihole/site-status'
import type { Settings } from './settings/schema'
import type { ExtensionState } from './state'

/**
 * Everything the popup and the options page can ask the background to do. Every Pi-hole request
 * happens in the background; pages only send these messages and watch storage.
 */
export interface ProtocolMap {
  /** Stored state. Kicks off a refresh when it is stale; the result arrives via `stateItem.watch`. */
  getState(): ExtensionState
  refresh(): ExtensionState
  setBlocking(data: { enabled: boolean; seconds?: number | null }): ActionResult
  extendPause(data: { seconds: number }): ActionResult
  toggle(): ActionResult
  getSiteStatus(data: { hostname: string; fresh?: boolean }): SiteStatus
  allowDomain(data: { hostname: string }): SiteMutationResult
  denyDomain(data: { hostname: string }): SiteMutationResult
  removeDomain(data: { hostname: string; list: ListType }): SiteMutationResult
  tempAllow(data: { hostname: string; minutes?: number }): SiteMutationResult
  testInstance(data: { url: string; password: string }): InstanceTestResult
  saveSettings(data: Partial<Settings>): Settings
  exportSettings(): string
  importSettings(data: { json: string }): Settings
  resetSettings(): Settings
  logoutInstance(data: { id: string }): void
  openOptions(data: { path?: string }): void
  getCurrentTabHostname(): string | null
}

export const { sendMessage, onMessage, removeAllListeners } = defineExtensionMessaging<ProtocolMap>()
