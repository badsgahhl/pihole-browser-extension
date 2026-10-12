import { beforeEach, describe, expect, it } from 'vitest'

import type { FakePihole } from '@/test/fake-pihole'
import { HOME, instance, OFFICE, seedSettings, simulateWorkerRestart, twoPiholes } from '@/test/helpers'

import {
  allowDomain,
  classify,
  denyDomain,
  deriveListName,
  getSiteStatus,
  removeDomain,
  TEMP_COMMENT_PREFIX
} from './site-status'

const STEVEN = 'https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts'

describe('deriveListName', () => {
  it.each([
    [{ address: STEVEN, comment: 'My list' }, 'My list'],
    [{ address: STEVEN, comment: null }, 'StevenBlack hosts'],
    [{ address: STEVEN, comment: 'Migrated from /etc/pihole/adlists.list' }, 'StevenBlack hosts'],
    [{ address: 'https://example.com/lists/ads.txt', comment: '' }, 'ads'],
    [{ address: 'https://example.com/', comment: null }, 'example.com'],
    [{ address: 'https://example.com/hosts', comment: null }, 'example.com hosts'],
    [{ address: 'garbage', comment: null }, 'garbage']
  ])('%j -> %s', (entry, expected) => {
    expect(deriveListName(entry)).toBe(expected)
  })
})

describe('classify', () => {
  const own = (
    type: 'allow' | 'deny',
    kind: 'exact' | 'regex' = 'exact',
    comment: string | null = null,
    enabled = true
  ) => ({
    domain: 'ads.example.com',
    type,
    kind,
    comment,
    enabled,
    id: 1,
    groups: [0],
    date_added: 1_700_000_000
  })

  it('reports the user’s own entries first', () => {
    expect(classify({ domains: [own('allow')], gravity: [] })).toMatchObject({
      verdict: 'allowed-own',
      ownEntry: { list: 'allow' }
    })
    expect(classify({ domains: [own('deny')], gravity: [] })).toMatchObject({
      verdict: 'blocked-own',
      ownEntry: { list: 'deny' }
    })
  })

  it('recognises a temporary allow entry and its expiry', () => {
    const until = new Date('2026-10-12T10:00:00Z')
    const result = classify({
      domains: [own('allow', 'exact', `${TEMP_COMMENT_PREFIX}${until.toISOString()}`)],
      gravity: []
    })
    expect(result.verdict).toBe('allowed-temp')
    expect(result.tempUntil).toBe(until.getTime())
  })

  it('ignores disabled entries and lets exact entries win over regex', () => {
    expect(classify({ domains: [own('deny', 'exact', null, false)], gravity: [] }).verdict).toBe('not-blocked')
    const result = classify({ domains: [own('allow', 'regex'), own('deny', 'exact')], gravity: [] })
    expect(result.verdict).toBe('allowed-own')
    expect(result.ownEntry?.kind).toBe('regex')
  })

  it('falls back to gravity lists', () => {
    const block = {
      domain: 'ads.example.com',
      address: STEVEN,
      comment: null,
      enabled: true,
      id: 5,
      type: 'block' as const
    }
    expect(classify({ domains: [], gravity: [block] })).toMatchObject({
      verdict: 'blocked-list',
      listName: 'StevenBlack hosts'
    })
    expect(classify({ domains: [], gravity: [{ ...block, type: 'allow' }] })).toMatchObject({ verdict: 'allowed-list' })
    expect(classify({ domains: [], gravity: [] }).verdict).toBe('not-blocked')
    expect(classify(undefined).verdict).toBe('not-blocked')
  })
})

describe('site status against two Pi-holes', () => {
  let home: FakePihole
  let office: FakePihole

  beforeEach(async () => {
    simulateWorkerRestart()
    ;({ home, office } = twoPiholes())
    await seedSettings([instance(HOME), instance(OFFICE)])
    home.addGravity('ads.example.com', STEVEN)
    office.addGravity('ads.example.com', STEVEN)
  })

  it('reports a list block and caches it for a while', async () => {
    const status = await getSiteStatus('ads.example.com')
    expect(status).toMatchObject({ verdict: 'blocked-list', listName: 'StevenBlack hosts' })
    expect(status.perInstance.map((p) => p.ok)).toEqual([true, true])

    await getSiteStatus('ads.example.com')
    expect(home.requestsTo('/search/ads.example.com')).toHaveLength(1)
    await getSiteStatus('ads.example.com', { fresh: true })
    expect(home.requestsTo('/search/ads.example.com')).toHaveLength(2)
  })

  it('allows a domain on every Pi-hole, removing deny entries first', async () => {
    home.addDomain('deny', 'exact', 'ads.example.com')
    office.addDomain('allow', 'exact', 'ads.example.com')

    const result = await allowDomain('ads.example.com')

    expect(result.ok).toBe(true)
    expect(result.status.verdict).toBe('allowed-own')
    expect(home.domains.map((d) => [d.type, d.domain])).toEqual([['allow', 'ads.example.com']])
    expect(office.domains).toHaveLength(1)
    expect(office.requestsTo('/domains/allow/exact', 'POST')).toHaveLength(1)
  })

  it('denies a domain, dropping an allow entry first', async () => {
    home.addDomain('allow', 'exact', 'ads.example.com')
    const result = await denyDomain('ads.example.com')
    expect(result.ok).toBe(true)
    expect(result.status.verdict).toBe('blocked-own')
    expect(home.domains.map((d) => d.type)).toEqual(['deny'])
    expect(office.domains.map((d) => d.type)).toEqual(['deny'])
  })

  it('removes the own entry and falls back to the list verdict', async () => {
    await allowDomain('ads.example.com')
    const result = await removeDomain('ads.example.com', 'allow')
    expect(result.ok).toBe(true)
    expect(result.status.verdict).toBe('blocked-list')
    expect(home.domains).toHaveLength(0)
  })

  it('reports a failing Pi-hole per instance and keeps going on the other', async () => {
    office.failAll('network')
    const result = await allowDomain('ads.example.com')
    expect(result.ok).toBe(false)
    expect(result.perInstance).toEqual([
      { id: `id:${HOME}`, ok: true },
      { id: `id:${OFFICE}`, ok: false, error: expect.objectContaining({ kind: 'unreachable' }) }
    ])
    expect(result.status.verdict).toBe('allowed-own')
    expect(home.domains).toHaveLength(1)
  })
})
