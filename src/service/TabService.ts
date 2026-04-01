import { PiHoleSettingsStorage, StorageService } from './StorageService'
import Tab = chrome.tabs.Tab

const urlValidityRegex = new RegExp('^(http|https):\\/\\/[^ "]+$')

export default class TabService {
  /**
   * Unwraps common redirect wrappers (e.g. Google /url?q=...) so the real destination host is used.
   */
  public static unwrapGoogleRedirectUrl(urlString: string): string {
    let current = urlString.trim()
    for (let depth = 0; depth < 5; depth++) {
      try {
        const u = new URL(current)
        const path = u.pathname.replace(/\/+$/, '') || '/'
        if (path !== '/url') {
          break
        }
        const inner =
          u.searchParams.get('q') ??
          u.searchParams.get('url') ??
          u.searchParams.get('u')
        if (!inner) {
          break
        }
        let decoded = inner
        try {
          decoded = decodeURIComponent(inner)
        } catch {
          decoded = inner
        }
        const candidate = decoded.trim()
        if (/^(https?:)\/\//i.test(candidate)) {
          current = candidate
        } else if (/^(https?:)\/\//i.test(inner.trim())) {
          current = inner.trim()
        } else {
          break
        }
      } catch {
        break
      }
    }
    return current
  }

  private static async getExcludedDomains(): Promise<string[]> {
    let excludesDomains: string[] = ['localhost', '127.0.0.1', 'pi.hole']

    const piHoleUrls = await StorageService.getPiHoleSettingsArray()
    const piHoleUrlsArray: string[] = []
    if (typeof piHoleUrls !== 'undefined') {
      piHoleUrls.forEach((value: PiHoleSettingsStorage) => {
        if (value.pi_uri_base) {
          piHoleUrlsArray.push(new URL(value.pi_uri_base).hostname)
        }
      })
    }

    if (piHoleUrlsArray.length > 0) {
      excludesDomains = excludesDomains.concat(piHoleUrlsArray)
    }

    return excludesDomains
  }

  /**
   * Returns the hostname for Pi-hole list operations from a link URL, or empty if invalid/excluded.
   */
  public static async getHostnameFromUrlForListing(
    rawUrl: string
  ): Promise<string> {
    const unwrapped = TabService.unwrapGoogleRedirectUrl(rawUrl)
    if (!urlValidityRegex.test(unwrapped)) {
      return ''
    }
    const excludesDomains = await TabService.getExcludedDomains()
    try {
      const { hostname } = new URL(unwrapped)
      if (!excludesDomains.includes(hostname)) {
        return hostname
      }
    } catch {
      return ''
    }
    return ''
  }

  /**
   * Returns the current tab url. Cleaned only the real domain without the parameters etc.
   */
  public static async getCurrentTabUrlCleaned(): Promise<string> {
    const currentTabUrlPromise: Promise<string> = new Promise(resolve => {
      chrome.tabs.query(
        { active: true, lastFocusedWindow: true, currentWindow: true },
        tabs => {
          if (tabs[0]) {
            const tabUrl = tabs[0].url ?? ''
            resolve(tabUrl)
          }
        }
      )
    })
    let url = ''
    const fullUrl = await currentTabUrlPromise
    const excludesDomains = await TabService.getExcludedDomains()

    if (urlValidityRegex.test(fullUrl)) {
      const { hostname } = new URL(fullUrl)
      if (!excludesDomains.includes(hostname)) {
        url = hostname
      }
    }
    return url
  }

  /**
   * Function to reload the current tab
   * @param delay in ms
   */
  public static reloadCurrentTab(delay: number = 0): void {
    const queryInfo = {
      active: true,
      lastFocusedWindow: true,
      currentWindow: true
    }
    const queryFunction = (tabs: Tab[]) => {
      if (tabs[0]) {
        this.getCurrentTabUrlCleaned().then(url => {
          if (url && tabs[0].id) {
            chrome.tabs.reload(tabs[0].id)
          }
        })
      }
    }
    const tabsFunction = () => chrome.tabs.query(queryInfo, queryFunction)

    if (delay > 0) {
      setTimeout(tabsFunction, delay)
    } else {
      tabsFunction()
    }
  }
}
