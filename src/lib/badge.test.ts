import { describe, expect, it } from 'vitest'
import { fakeBrowser } from 'wxt/testing/fake-browser'

import { applyBadge, BADGE_COLORS, computeBadge } from './badge'
import { combine, emptyInstanceStatus, type InstanceStatus } from './state'

function status(overrides: Partial<InstanceStatus>): InstanceStatus {
  return {
    ...emptyInstanceStatus({ id: 'a', name: 'A', url: 'http://a', password: '' }),
    permissionGranted: true,
    blocking: 'enabled',
    lastOkAt: 1,
    ...overrides
  }
}

describe('computeBadge', () => {
  const now = 1_000_000

  it('is empty when the badge is off', () => {
    expect(computeBadge(combine([status({})]), 'off', now).text).toBe('')
  })

  it('shows INFO for setup and permission problems', () => {
    expect(computeBadge(combine([]), 'state', now)).toMatchObject({ text: 'badge_info', color: BADGE_COLORS.info })
    const perm = combine([status({ blocking: null, error: { kind: 'permission', message: 'x' } })])
    expect(computeBadge(perm, 'state', now)).toMatchObject({ text: 'badge_info', title: 'badge_title_needsPermission' })
  })

  it('shows ERR for unreachable and INFO for a wrong password', () => {
    const down = combine([status({ blocking: null, error: { kind: 'unreachable', message: 'x' } })])
    expect(computeBadge(down, 'state', now)).toMatchObject({ text: 'badge_error', color: BADGE_COLORS.error })
    const unauthorized = combine([status({ blocking: null, error: { kind: 'unauthorized', message: 'x' } })])
    expect(computeBadge(unauthorized, 'state', now)).toMatchObject({
      text: 'badge_info',
      title: 'badge_title_unauthorized'
    })
  })

  it('shows ON or the blocked percentage when enabled', () => {
    const state = combine([status({ stats: { queries: 10, blocked: 4, percentBlocked: 38.4, clients: 2 } })])
    expect(computeBadge(state, 'state', now)).toMatchObject({ text: 'badge_on', color: BADGE_COLORS.on })
    expect(computeBadge(state, 'percent', now).text).toBe('38%')
    expect(computeBadge(combine([status({})]), 'percent', now).text).toBe('badge_on')
  })

  it('counts down in minutes when paused and shows OFF for an indefinite pause', () => {
    const paused = combine([status({ blocking: 'disabled', timerEndsAt: now + 272_000 })])
    expect(computeBadge(paused, 'state', now)).toMatchObject({
      text: '5m',
      color: BADGE_COLORS.paused,
      title: 'badge_title_paused:04:32'
    })
    const forever = combine([status({ blocking: 'disabled', timerEndsAt: null })])
    expect(computeBadge(forever, 'state', now)).toMatchObject({ text: 'badge_off', color: BADGE_COLORS.off })
  })

  it('shows MIX when only some are paused', () => {
    const mixed = combine([status({ id: 'a' }), status({ id: 'b', blocking: 'disabled' })])
    expect(computeBadge(mixed, 'state', now).text).toBe('badge_mixed')
  })

  it('never exceeds four characters', () => {
    const samples = [
      combine([]),
      combine([status({})]),
      combine([status({ blocking: 'disabled', timerEndsAt: now + 99 * 60_000 })]),
      combine([status({ stats: { queries: 1, blocked: 1, percentBlocked: 100, clients: 1 } })])
    ]
    for (const state of samples) {
      for (const mode of ['state', 'percent'] as const) {
        const text = computeBadge(state, mode, now).text
        expect(text === '' || text.startsWith('badge_') || text.length <= 4).toBe(true)
      }
    }
  })
})

describe('applyBadge', () => {
  it('writes text, colour and title to the action', async () => {
    const state = combine([status({})])
    await applyBadge(state, 'state')
    expect(await fakeBrowser.action.getBadgeText({})).toBe('badge_on')
    // The fake browser stores colours as RGBA tuples.
    const rgba = BADGE_COLORS.on.match(/[0-9a-f]{2}/g)!.map((part) => Number.parseInt(part, 16))
    expect(await fakeBrowser.action.getBadgeBackgroundColor({})).toEqual([...rgba, 255])
    expect(await fakeBrowser.action.getTitle({})).toBe('badge_title_enabled')
  })
})
