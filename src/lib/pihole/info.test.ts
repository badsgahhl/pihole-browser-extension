import { beforeEach, describe, expect, it } from 'vitest'

import { FakePihole, installFakeNetwork } from '@/test/fake-pihole'
import { contextFor, HOME, instance, simulateWorkerRestart } from '@/test/helpers'

import { fetchStats, fetchVersions, isNewer } from './info'

describe('isNewer', () => {
  it.each([
    ['v6.5.0', 'v6.4.2', true],
    ['v6.4.2', 'v6.4.2', false],
    ['v6.4.1', 'v6.4.2', false],
    ['v7.0', 'v6.9.9', true],
    ['2026.10.2', '2026.10.1', true],
    [null, 'v6.4.2', false],
    ['v6.5', null, false],
    ['custom-branch', 'v6.4.2', false]
  ])('%s newer than %s -> %s', (remote, local, expected) => {
    expect(isNewer(remote, local)).toBe(expected)
  })
})

describe('fetchVersions / fetchStats', () => {
  let pihole: FakePihole

  beforeEach(() => {
    simulateWorkerRestart()
    pihole = new FakePihole('secret')
    installFakeNetwork({ [HOME]: pihole })
  })

  it('reads local versions and detects an update', async () => {
    pihole.versions.remote.ftl = 'v6.7.0'
    const versions = await fetchVersions(await contextFor(instance(HOME)))
    expect(versions).toEqual({ core: 'v6.4.2', web: 'v6.5', ftl: 'v6.6.1', docker: '2026.10.1', updateAvailable: true })
  })

  it('maps the summary', async () => {
    expect(await fetchStats(await contextFor(instance(HOME)))).toEqual({
      queries: 98_585,
      blocked: 35_537,
      percentBlocked: 36.04,
      clients: 24
    })
  })
})
