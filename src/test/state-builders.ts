import { combine, emptyInstanceStatus, type ExtensionState, type InstanceStatus } from '@/lib/state'

/** A healthy, blocking instance status with overrides. */
export function instanceStatus(overrides: Partial<InstanceStatus> = {}): InstanceStatus {
  return {
    ...emptyInstanceStatus({ id: overrides.id ?? 'home', name: 'Home', url: 'http://pi.hole', password: 'x' }),
    name: overrides.name ?? overrides.id ?? 'Home',
    permissionGranted: true,
    blocking: 'enabled',
    lastOkAt: Date.now(),
    versions: { core: 'v6.4.2', web: 'v6.5', ftl: 'v6.6.1', docker: null, updateAvailable: false },
    versionsAt: Date.now(),
    ...overrides
  }
}

export function stateWith(...instances: InstanceStatus[]): ExtensionState {
  return combine(instances, { lastRefreshAt: Date.now() })
}
