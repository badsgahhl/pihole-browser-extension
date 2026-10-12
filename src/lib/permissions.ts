import { browser } from '#imports'
import type { Settings } from '@/lib/settings/schema'
import { originPattern } from '@/lib/settings/url'

/** Whether the browser lets the extension talk to the Pi-hole at this URL. */
export async function hasHostPermission(url: string): Promise<boolean> {
  try {
    return await browser.permissions.contains({ origins: [originPattern(url)] })
  } catch {
    return false
  }
}

/** Must run inside a user gesture, so only pages call it. */
export async function requestHostPermission(url: string): Promise<boolean> {
  try {
    return await browser.permissions.request({ origins: [originPattern(url)] })
  } catch {
    return false
  }
}

/** Origin patterns of configured instances the browser has not granted yet. */
export async function missingOrigins(settings: Settings): Promise<string[]> {
  const missing: string[] = []
  for (const instance of settings.instances) {
    if (!(await hasHostPermission(instance.url))) missing.push(originPattern(instance.url))
  }
  return missing
}

/** Gives back origin permissions that no configured instance uses anymore. */
export async function pruneHostPermissions(settings: Settings): Promise<void> {
  const needed = new Set(settings.instances.map((instance) => originPattern(instance.url)))
  let granted: string[]
  try {
    granted = (await browser.permissions.getAll()).origins ?? []
  } catch {
    return
  }
  const stale = granted.filter((origin) => !needed.has(origin) && !origin.includes('*://*'))
  if (stale.length === 0) return
  try {
    await browser.permissions.remove({ origins: stale })
  } catch {
    // Not fatal: the permission just stays granted.
  }
}
