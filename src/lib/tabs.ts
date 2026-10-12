import { browser } from '#imports'

import type { Settings } from './settings/schema'
import { instanceHostname } from './settings/url'

/** Hosts that never make sense to allow or deny. */
export const EXCLUDED_HOSTS = ['localhost', '127.0.0.1', '[::1]', 'pi.hole']

/**
 * The hostname a tab URL stands for in Pi-hole terms, or `null` when the tab is not a regular web
 * page (browser pages, files, the Pi-hole itself, local addresses).
 */
export function cleanHostname(
  url: string | undefined,
  excludedHosts: readonly string[] = EXCLUDED_HOSTS
): string | null {
  if (!url) return null
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
  const hostname = parsed.hostname.toLowerCase()
  if (hostname === '' || excludedHosts.includes(hostname)) return null
  return hostname
}

export function excludedHostsFor(settings: Settings): string[] {
  return [...EXCLUDED_HOSTS, ...settings.instances.map((instance) => instanceHostname(instance.url).toLowerCase())]
}

async function currentTab() {
  // The background has no window of its own; the last focused window is the one the person sees.
  try {
    const focused = await browser.tabs.query({ active: true, lastFocusedWindow: true })
    if (focused[0]) return focused[0]
  } catch {
    // Some environments cannot answer the window filter; fall through to any active tab.
  }
  const active = await browser.tabs.query({ active: true })
  return active[0]
}

export async function getCurrentTabHostname(settings: Settings): Promise<string | null> {
  const tab = await currentTab()
  return cleanHostname(tab?.url, excludedHostsFor(settings))
}

/** Reloads the tab that is active now, after a delay that lets the DNS change settle. */
export async function reloadCurrentTab(delayMs: number, settings: Settings): Promise<void> {
  const tab = await currentTab()
  if (!tab?.id || cleanHostname(tab.url, excludedHostsFor(settings)) === null) return
  const tabId = tab.id
  await new Promise((resolve) => setTimeout(resolve, delayMs))
  try {
    await browser.tabs.reload(tabId)
  } catch {
    // The tab is gone; nothing to reload.
  }
}
