import { describe, expect, it } from 'vitest'

import { detectBrowser, shortcutsPageUrl } from './browser-info'

const CHROME =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const EDGE = `${CHROME} Edg/131.0.2903.70`
const OPERA = `${CHROME} OPR/115.0.0.0`
const FIREFOX = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0'

describe('detectBrowser', () => {
  it.each([
    [CHROME, { name: 'Chrome', version: '131.0.0.0' }],
    [EDGE, { name: 'Edge', version: '131.0.2903.70' }],
    [OPERA, { name: 'Opera', version: '115.0.0.0' }],
    [FIREFOX, { name: 'Firefox', version: '128.0' }],
    ['curl/8.0', { name: 'Unknown', version: '' }]
  ])('%s', (userAgent, expected) => {
    expect(detectBrowser(userAgent)).toEqual(expected)
  })
})

describe('shortcutsPageUrl', () => {
  it('knows each browser’s shortcuts page and that Firefox has none', () => {
    expect(shortcutsPageUrl(detectBrowser(CHROME))).toBe('chrome://extensions/shortcuts')
    expect(shortcutsPageUrl(detectBrowser(EDGE))).toBe('edge://extensions/shortcuts')
    expect(shortcutsPageUrl(detectBrowser(OPERA))).toBe('opera://extensions/shortcuts')
    expect(shortcutsPageUrl(detectBrowser(FIREFOX))).toBeNull()
  })
})
