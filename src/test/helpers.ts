import { vi } from 'vitest'
import { fakeBrowser } from 'wxt/testing/fake-browser'

import { _resetActionsForTests } from '@/lib/pihole/actions'
import { _resetClientsForTests } from '@/lib/pihole/client'
import { type InstanceContext, toContext } from '@/lib/pihole/instances'
import { _resetSessionMemoryForTests } from '@/lib/pihole/session'
import { DEFAULT_SETTINGS } from '@/lib/settings/defaults'
import { type Instance, type Settings, validateSettings } from '@/lib/settings/schema'
import { settingsItem } from '@/lib/settings/storage'

import { FakePihole, installFakeNetwork } from './fake-pihole'

export const HOME = 'http://pi.hole'
export const OFFICE = 'https://office.example'

export function instance(url: string, password = 'secret', overrides: Partial<Instance> = {}): Instance {
  return { id: overrides.id ?? `id:${url}`, name: overrides.name ?? new URL(url).hostname, url, password, ...overrides }
}

/** Stores settings with the given instances and returns them. Tab reloads are off to keep tests quiet. */
export async function seedSettings(instances: Instance[], partial: Partial<Settings> = {}): Promise<Settings> {
  const settings = validateSettings({
    ...DEFAULT_SETTINGS,
    reloadAfterPause: false,
    reloadAfterAllow: false,
    ...partial,
    instances
  })
  await settingsItem.setValue(settings)
  return settings
}

export function contextFor(inst: Instance, timeoutMs = 5_000): Promise<InstanceContext> {
  return toContext(inst, timeoutMs)
}

/** Two fake Pi-holes on the network. Returns them for inspection. */
export function twoPiholes(): { home: FakePihole; office: FakePihole } {
  const home = new FakePihole('secret')
  const office = new FakePihole('secret')
  installFakeNetwork({ [HOME]: home, [OFFICE]: office })
  return { home, office }
}

/** Simulates the service worker being terminated: module memory is gone, storage stays. */
export function simulateWorkerRestart(): void {
  _resetSessionMemoryForTests()
  _resetClientsForTests()
  _resetActionsForTests()
}

type Permissions = {
  contains: ReturnType<typeof vi.fn>
  request: ReturnType<typeof vi.fn>
  getAll: ReturnType<typeof vi.fn>
  remove: ReturnType<typeof vi.fn>
}

export function permissionsMock(): Permissions {
  return (fakeBrowser as unknown as { permissions: Permissions }).permissions
}
