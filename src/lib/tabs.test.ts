import { describe, expect, it } from 'vitest'
import { fakeBrowser } from 'wxt/testing/fake-browser'

import { DEFAULT_SETTINGS } from './settings/defaults'
import { validateSettings } from './settings/schema'
import { cleanHostname, excludedHostsFor, getCurrentTabHostname } from './tabs'

describe('cleanHostname', () => {
  it.each([
    ['https://www.example.com/path?x=1', 'www.example.com'],
    ['http://Example.COM:8080/', 'example.com'],
    ['https://ads.google.com', 'ads.google.com']
  ])('keeps the host of %s', (url, expected) => {
    expect(cleanHostname(url)).toBe(expected)
  })

  it.each([
    [undefined],
    [''],
    ['chrome://extensions'],
    ['about:blank'],
    ['file:///C:/x.html'],
    ['moz-extension://abc/popup.html'],
    ['http://localhost:3000'],
    ['http://127.0.0.1'],
    ['http://pi.hole/admin'],
    ['not a url']
  ])('ignores %s', (url) => {
    expect(cleanHostname(url)).toBeNull()
  })

  it('also ignores the configured Pi-holes', () => {
    const settings = validateSettings({ ...DEFAULT_SETTINGS, instances: [{ url: 'http://192.168.178.20:9802' }] })
    const excluded = excludedHostsFor(settings)
    expect(cleanHostname('http://192.168.178.20:9802/admin', excluded)).toBeNull()
    expect(cleanHostname('https://example.org', excluded)).toBe('example.org')
  })
})

describe('getCurrentTabHostname', () => {
  it('reads the active tab', async () => {
    await fakeBrowser.tabs.create({ url: 'https://news.example.com/story', active: true })
    const settings = validateSettings(DEFAULT_SETTINGS)
    expect(await getCurrentTabHostname(settings)).toBe('news.example.com')
  })
})
