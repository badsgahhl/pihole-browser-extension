import { describe, expect, it } from 'vitest'

import { combine, emptyInstanceStatus, type InstanceStatus, isStale } from './state'

function status(overrides: Partial<InstanceStatus>): InstanceStatus {
  return {
    ...emptyInstanceStatus({ id: overrides.id ?? 'a', name: 'A', url: 'http://a', password: '' }),
    permissionGranted: true,
    blocking: 'enabled',
    lastOkAt: 1,
    ...overrides
  }
}

describe('combine', () => {
  it('is needs-setup without instances', () => {
    expect(combine([]).overall).toBe('needs-setup')
  })

  it('is enabled when every instance blocks', () => {
    const state = combine([status({ id: 'a' }), status({ id: 'b' })])
    expect(state.overall).toBe('enabled')
    expect(state.degraded).toBe(false)
  })

  it('is paused with the latest timer end when every instance is paused', () => {
    const state = combine([
      status({ id: 'a', blocking: 'disabled', timerEndsAt: 1000 }),
      status({ id: 'b', blocking: 'disabled', timerEndsAt: 2000 })
    ])
    expect(state.overall).toBe('paused')
    expect(state.timerEndsAt).toBe(2000)
    expect(state.pausedIndefinitely).toBe(false)
  })

  it('flags an indefinite pause', () => {
    const state = combine([status({ blocking: 'disabled', timerEndsAt: null })])
    expect(state.pausedIndefinitely).toBe(true)
    expect(state.timerEndsAt).toBeNull()
  })

  it('is mixed when only some are paused', () => {
    expect(combine([status({ id: 'a' }), status({ id: 'b', blocking: 'disabled' })]).overall).toBe('mixed')
  })

  it('is error when nothing answers', () => {
    const state = combine([status({ blocking: null, error: { kind: 'unreachable', message: 'x' } })])
    expect(state.overall).toBe('error')
  })

  it('prefers needs-permission over error and over a healthy sibling', () => {
    expect(combine([status({ blocking: null, error: { kind: 'permission', message: 'x' } })]).overall).toBe(
      'needs-permission'
    )
    const mixed = combine([
      status({ id: 'a' }),
      status({ id: 'b', blocking: null, error: { kind: 'permission', message: 'x' } })
    ])
    expect(mixed.overall).toBe('needs-permission')
    expect(mixed.degraded).toBe(true)
  })

  it('is degraded but keeps the healthy status when one instance fails', () => {
    const state = combine([
      status({ id: 'a' }),
      status({ id: 'b', blocking: null, error: { kind: 'unreachable', message: 'x' } })
    ])
    expect(state.overall).toBe('enabled')
    expect(state.degraded).toBe(true)
  })

  it('treats failed blocking as an error', () => {
    expect(combine([status({ blocking: 'failed', error: { kind: 'unknown', message: 'x' } })]).overall).toBe('error')
  })

  it('aggregates stats, versions and messages', () => {
    const state = combine([
      status({
        id: 'a',
        stats: { queries: 10, blocked: 4, percentBlocked: 40, clients: 3 },
        versions: { core: '1', web: '1', ftl: '1', docker: null, updateAvailable: true },
        messagesCount: 2
      }),
      status({ id: 'b', messagesCount: 1 })
    ])
    expect(state.percentBlocked).toBe(40)
    expect(state.clients).toBe(3)
    expect(state.updateAvailable).toBe(true)
    expect(state.messagesCount).toBe(3)
  })
})

describe('isStale', () => {
  it('compares against lastRefreshAt', () => {
    const state = combine([], { lastRefreshAt: 1000 })
    expect(isStale(state, 10_000, 5000)).toBe(false)
    expect(isStale(state, 10_000, 20_000)).toBe(true)
  })
})
