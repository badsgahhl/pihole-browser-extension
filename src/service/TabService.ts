import { PiHoleSettingsStorage, StorageService } from './StorageService';
import Tab = chrome.tabs.Tab;

export default class TabService {
  /**
   * Returns the current tab url. Cleaned only the real domain without the parameters etc.
   */
  public static async getCurrentTabUrlCleaned(): Promise<string> {
    const currentTabUrlPromise: Promise<string> = new Promise((resolve) => {
      chrome.tabs.query({ active: true, lastFocusedWindow: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          const tabUrl = tabs[0].url ?? '';
          resolve(tabUrl);
        }
      });
    });
    let url = '';
    const fullUrl = (await currentTabUrlPromise);
    const urlValidityRegex = new RegExp('^(http|https):\\/\\/[^ "]+$');

    // Domains that should not be listed anyway.
    let excludesDomains: Array<string> = [
      'localhost',
      '127.0.0.1',
      'pi.hole',
    ];

    const piHoleUrls = (await StorageService.getPiHoleSettingsArray());
    const piHoleUrlsArray: Array<string> = [];
    if (typeof piHoleUrls !== 'undefined') {
      piHoleUrls.forEach(((value: PiHoleSettingsStorage) => {
        if (value.pi_uri_base) {
          piHoleUrlsArray.push((new URL(value.pi_uri_base).hostname));
        }
      }));
    }

    if (piHoleUrlsArray.length > 0) {
      excludesDomains = excludesDomains.concat(piHoleUrlsArray);
    }

    // Checking regex
    if (urlValidityRegex.test(fullUrl)) {
      const { hostname } = new URL(fullUrl);
      // Check if url is on the excluded list
      if (!excludesDomains.includes(hostname)) {
        url = hostname;
      }
    }
    return url;
  }

  /**
   * Function to reload the current tab
   * @param delay in ms
   */
  public static reloadCurrentTab(delay: number = 0): void {
    const queryInfo = {
      active: true,
      lastFocusedWindow: true,
      currentWindow: true,
    };
    const queryFunction = (tabs: Tab[]) => {
      if (tabs[0]) {
        this.getCurrentTabUrlCleaned().then((url) => {
          if (url && tabs[0].id) {
            chrome.tabs.reload(tabs[0].id);
          }
        });
      }
    };
    const tabsFunction = () => chrome.tabs.query(queryInfo, queryFunction);

    if (delay > 0) {
      setTimeout(tabsFunction, delay);
    } else {
      tabsFunction();
    }
  }
}
