import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeBrowser } from 'wxt/testing/fake-browser'

import { tempAllowAlarmName } from '@/lib/alarms'
import type { FakePihole } from '@/test/fake-pihole'
import { HOME, instance, OFFICE, seedSettings, simulateWorkerRestart, twoPiholes } from '@/test/helpers'

import { TEMP_COMMENT_PREFIX } from './site-status'
import { cleanupTempAllows, expireTempAllow, tempAllow, tempAllowItem } from './temp-allow'

describe('temporary allow', () => {
  let home: FakePihole
  let office: FakePihole

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-12T08:00:00Z'))
    simulateWorkerRestart()
    ;({ home, office } = twoPiholes())
    await seedSettings([instance(HOME), instance(OFFICE)], { tempAllowMinutes: 10 })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('adds a dated entry on every Pi-hole and schedules its removal', async () => {
    const result = await tempAllow('cdn.example.com')

    expect(result.ok).toBe(true)
    expect(result.status.verdict).toBe('allowed-temp')
    expect(result.status.tempUntil).toBe(Date.now() + 10 * 60_000)
    expect(home.domains[0]?.comment).toBe(`${TEMP_COMMENT_PREFIX}2026-10-12T08:10:00.000Z`)
    expect(office.domains).toHaveLength(1)

    const [entry] = await tempAllowItem.getValue()
    expect(entry).toMatchObject({
      hostname: 'cdn.example.com',
      instanceIds: [`id:${HOME}`, `id:${OFFICE}`],
      attempts: 0
    })
    expect(await fakeBrowser.alarms.get(tempAllowAlarmName(entry!.id))).toBeTruthy()
  })

  it('keeps an entry added while another one is expiring', async () => {
    await tempAllow('one.example')
    const [one] = await tempAllowItem.getValue()
    home.delayWhen((_method, path) => path.startsWith('/search/one.example'), 60)

    const expiring = expireTempAllow(one!.id)
    await new Promise((resolve) => setTimeout(resolve, 10))
    await tempAllow('two.example')
    await expiring

    expect((await tempAllowItem.getValue()).map((entry) => entry.hostname)).toEqual(['two.example'])
    expect(home.domains.map((entry) => entry.domain)).toEqual(['two.example'])
  })

  it('leaves a permanent allow entry alone', async () => {
    home.addDomain('allow', 'exact', 'cdn.example.com', 'mine')
    const result = await tempAllow('cdn.example.com', 5)
    expect(result.ok).toBe(true)
    expect(home.domains).toHaveLength(1)
    expect(home.domains[0]?.comment).toBe('mine')
    expect(office.domains[0]?.comment).toContain(TEMP_COMMENT_PREFIX)
    expect((await tempAllowItem.getValue())[0]?.instanceIds).toEqual([`id:${OFFICE}`])
  })

  it('expires the entry on both Pi-holes and forgets it', async () => {
    await tempAllow('cdn.example.com')
    const [entry] = await tempAllowItem.getValue()

    await expireTempAllow(entry!.id)

    expect(home.domains).toHaveLength(0)
    expect(office.domains).toHaveLength(0)
    expect(await tempAllowItem.getValue()).toEqual([])
    expect(await fakeBrowser.alarms.get(tempAllowAlarmName(entry!.id))).toBeUndefined()
  })

  it('does not delete an entry the user made permanent in the meantime', async () => {
    await tempAllow('cdn.example.com')
    const [entry] = await tempAllowItem.getValue()
    home.domains[0]!.comment = 'keep me'

    await expireTempAllow(entry!.id)

    expect(home.domains).toHaveLength(1)
    expect(office.domains).toHaveLength(0)
  })

  it('retries later when a Pi-hole is unreachable at expiry', async () => {
    await tempAllow('cdn.example.com')
    const [entry] = await tempAllowItem.getValue()
    office.failAll('network')

    await expireTempAllow(entry!.id)

    expect(home.domains).toHaveLength(0)
    expect(office.domains).toHaveLength(1)
    expect((await tempAllowItem.getValue())[0]?.attempts).toBe(1)
    const alarm = await fakeBrowser.alarms.get(tempAllowAlarmName(entry!.id))
    expect(alarm?.scheduledTime).toBe(Date.now() + 60_000)
  })

  it('cleans up overdue entries on startup', async () => {
    await tempAllow('cdn.example.com', 1)
    vi.setSystemTime(new Date('2026-10-12T08:05:00Z'))

    await cleanupTempAllows()

    expect(home.domains).toHaveLength(0)
    expect(await tempAllowItem.getValue()).toEqual([])
  })
})
