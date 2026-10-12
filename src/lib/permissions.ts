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

/**
 * Gives back the origins of instances that were removed or moved, unless another instance still
 * uses them. Only patterns the extension requested itself are touched; whatever the user granted
 * through the browser's own site-access UI is left alone.
 */
export async function releaseHostPermissions(previous: Settings, next: Settings): Promise<void> {
  const stillNeeded = new Set(next.instances.map((instance) => originPattern(instance.url)))
  const release = [...new Set(previous.instances.map((instance) => originPattern(instance.url)))].filter(
    (pattern) => !stillNeeded.has(pattern)
  )
  if (release.length === 0) return
  try {
    await browser.permissions.remove({ origins: release })
  } catch {
    // Not fatal: the permission just stays granted.
  }
}
