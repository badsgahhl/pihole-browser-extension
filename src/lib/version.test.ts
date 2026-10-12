import { describe, expect, it } from 'vitest'

import { bareVersion, formatVersions, versionLines } from './version'

describe('version helpers', () => {
  it('strips the v prefix only in front of a digit', () => {
    expect(bareVersion('v6.4.2')).toBe('6.4.2')
    expect(bareVersion('6.4.2')).toBe('6.4.2')
    expect(bareVersion('vdev')).toBe('vdev')
    expect(bareVersion(null)).toBe('')
  })

  it('lists known components in order and skips missing ones', () => {
    expect(versionLines({ core: 'v6.4.2', ftl: 'v6.6.1', web: null, docker: 'v2026.10.1' })).toEqual([
      'Core 6.4.2',
      'FTL 6.6.1',
      'Docker 2026.10.1'
    ])
    expect(formatVersions({ core: 'v6.4.2', ftl: 'v6.6.1', web: 'v6.5' })).toBe('Core 6.4.2 · FTL 6.6.1 · Web 6.5')
    expect(formatVersions({ core: 'v6.4.2', ftl: null, web: null, docker: 'v2026.10.1' }, { docker: false })).toBe(
      'Core 6.4.2'
    )
    expect(formatVersions(null)).toBe('')
  })
})
