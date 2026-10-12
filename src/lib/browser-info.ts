export type BrowserName = 'Firefox' | 'Edge' | 'Opera' | 'Chrome' | 'Unknown'

export interface BrowserInfo {
  name: BrowserName
  version: string
}

/** Coarse browser detection from the user agent, for debug output and browser specific links. */
export function detectBrowser(userAgent: string = navigator.userAgent): BrowserInfo {
  const version = (pattern: RegExp) => userAgent.match(pattern)?.[1] ?? ''
  if (userAgent.includes('Firefox/')) return { name: 'Firefox', version: version(/Firefox\/([\d.]+)/) }
  if (userAgent.includes('Edg/')) return { name: 'Edge', version: version(/Edg\/([\d.]+)/) }
  if (userAgent.includes('OPR/')) return { name: 'Opera', version: version(/OPR\/([\d.]+)/) }
  if (userAgent.includes('Chrome/')) return { name: 'Chrome', version: version(/Chrome\/([\d.]+)/) }
  return { name: 'Unknown', version: '' }
}

/** The browser's own page for extension shortcuts, or `null` where it cannot be opened (Firefox). */
export function shortcutsPageUrl(info: BrowserInfo): string | null {
  switch (info.name) {
    case 'Firefox':
      return null
    case 'Edge':
      return 'edge://extensions/shortcuts'
    case 'Opera':
      return 'opera://extensions/shortcuts'
    default:
      return 'chrome://extensions/shortcuts'
  }
}
