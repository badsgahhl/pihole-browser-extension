import { describe, expect, it } from 'vitest'

import { apiBaseUrl, instanceHostname, InvalidUrlError, normalizeInstanceUrl, originPattern } from './url'

describe('normalizeInstanceUrl', () => {
  it.each([
    ['http://pi.hole/admin', 'http://pi.hole'],
    ['http://pi.hole/admin/', 'http://pi.hole'],
    ['http://pi.hole/admin/login', 'http://pi.hole'],
    ['http://192.168.178.20:9802/', 'http://192.168.178.20:9802'],
    ['http://192.168.178.20:9802', 'http://192.168.178.20:9802'],
    ['https://home.example/pihole/admin/', 'https://home.example/pihole'],
    ['https://home.example/pihole/api', 'https://home.example/pihole'],
    ['https://home.example/pihole', 'https://home.example/pihole'],
    ['HTTP://PI.HOLE', 'http://pi.hole'],
    ['pi.hole', 'http://pi.hole'],
    ['192.168.1.2:8080', 'http://192.168.1.2:8080'],
    [' http://pi.hole /admin ', 'http://pi.hole'],
    ['http://pi.hole/?x=1#top', 'http://pi.hole'],
    ['http://pi.hole:80/', 'http://pi.hole'],
    ['https://pi.hole:443/admin', 'https://pi.hole']
  ])('%s -> %s', (input, expected) => {
    expect(normalizeInstanceUrl(input)).toBe(expected)
  })

  it('keeps an /admin-like segment that is not the last one', () => {
    expect(normalizeInstanceUrl('http://host/administration/pihole')).toBe('http://host/administration/pihole')
  })

  it.each([
    ['', 'empty'],
    ['   ', 'empty'],
    ['ftp://pi.hole', 'scheme'],
    ['http://', 'invalid'],
    ['http://[::1', 'invalid']
  ])('rejects %j with reason %s', (input, reason) => {
    expect(() => normalizeInstanceUrl(input)).toThrow(InvalidUrlError)
    expect(() => normalizeInstanceUrl(input)).toThrow(expect.objectContaining({ reason }))
  })
})

describe('url helpers', () => {
  it('derives origin pattern, hostname and api base', () => {
    const url = 'https://home.example:8443/pihole'
    expect(originPattern(url)).toBe('https://home.example:8443/*')
    expect(instanceHostname(url)).toBe('home.example')
    expect(apiBaseUrl(url)).toBe('https://home.example:8443/pihole/api')
  })
})
