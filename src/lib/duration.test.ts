import { describe, expect, it } from 'vitest'

import { formatBadgeCountdown, formatCountdown, formatDuration, PAUSE_PRESETS, parseDuration } from './duration'

describe('formatDuration', () => {
  it('labels the presets the way the popup shows them', () => {
    expect(PAUSE_PRESETS.map(formatDuration)).toEqual(['10s', '30s', '5m', '30m', '1h', '∞'])
  })

  it('combines units', () => {
    expect(formatDuration(5400)).toBe('1h 30m')
    expect(formatDuration(3661)).toBe('1h 1m 1s')
  })

  it('returns an empty string for invalid input', () => {
    expect(formatDuration(-1)).toBe('')
    expect(formatDuration(Number.NaN)).toBe('')
  })
})

describe('formatCountdown', () => {
  it('formats minutes and seconds', () => {
    expect(formatCountdown(272_000)).toBe('04:32')
    expect(formatCountdown(0)).toBe('00:00')
  })

  it('adds hours from one hour on', () => {
    expect(formatCountdown(3_600_000)).toBe('1:00:00')
    expect(formatCountdown(5_401_000)).toBe('1:30:01')
  })

  it('rounds up and never goes negative', () => {
    expect(formatCountdown(500)).toBe('00:01')
    expect(formatCountdown(-5000)).toBe('00:00')
  })
})

describe('formatBadgeCountdown', () => {
  it('stays within four characters', () => {
    const samples = [0, 30_000, 272_000, 59 * 60_000, 99 * 60_000, 100 * 60_000, 5 * 3_600_000]
    for (const ms of samples) {
      expect(formatBadgeCountdown(ms).length).toBeLessThanOrEqual(4)
    }
  })

  it('uses minutes below 100 minutes and hours above', () => {
    expect(formatBadgeCountdown(30_000)).toBe('<1m')
    expect(formatBadgeCountdown(272_000)).toBe('4m')
    expect(formatBadgeCountdown(99 * 60_000)).toBe('99m')
    expect(formatBadgeCountdown(100 * 60_000)).toBe('1h')
    expect(formatBadgeCountdown(5 * 3_600_000)).toBe('5h')
  })
})

describe('parseDuration', () => {
  it('reads plain seconds', () => {
    expect(parseDuration('90')).toBe(90)
    expect(parseDuration(' 0 ')).toBe(0)
  })

  it('reads unit suffixes', () => {
    expect(parseDuration('5m')).toBe(300)
    expect(parseDuration('1h30m')).toBe(5400)
    expect(parseDuration('45 s')).toBe(45)
    expect(parseDuration('2 hours 5 minutes')).toBe(7500)
    expect(parseDuration('1.5h')).toBe(5400)
  })

  it('reads clock notation', () => {
    expect(parseDuration('1:30')).toBe(90)
    expect(parseDuration('1:00:00')).toBe(3600)
  })

  it('treats the infinity sign as an indefinite pause', () => {
    expect(parseDuration('∞')).toBe(0)
  })

  it('rejects text that is not a duration', () => {
    expect(parseDuration('')).toBeNull()
    expect(parseDuration('-5')).toBeNull()
    expect(parseDuration('five minutes')).toBeNull()
    expect(parseDuration('5m later')).toBeNull()
  })
})
