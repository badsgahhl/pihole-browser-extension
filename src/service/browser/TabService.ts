import {PiHoleSettingsStorage, StorageService} from "./StorageService";
import ServiceLocator from "../ServiceLocator";
import Tab = chrome.tabs.Tab;

export class TabService {

    /**
     * Returns the current tab url. Cleaned only the real domain without the parameters etc.
     */
    public async get_current_tab_url_cleaned(): Promise<string> {
        const current_tab_url_promise: Promise<string> = new Promise((resolve) => {
            chrome.tabs.query({'active': true, 'lastFocusedWindow': true, 'currentWindow': true}, function (tabs) {
                if (tabs[0]) {
                    const tab_url = tabs[0].url ?? '';
                    resolve(tab_url);
                }
            });
        });
        let url = '';
        let full_url = (await current_tab_url_promise);
        const url_validity_regex = new RegExp('^(http|https):\\/\\/[^ "]+$');

        // Domains that should not be listed anyway.
        let excluded_domains: Array<string> = [
            'localhost',
            '127.0.0.1',
            'pi.hole'
        ];

        let pi_hole_urls = (await this.get_storage_service().get_pi_hole_settings_array());
        let pi_hole_urls_array: Array<string> = [];
        if (typeof pi_hole_urls !== "undefined") {
            pi_hole_urls.forEach(((value: PiHoleSettingsStorage) => {
                if (value.pi_uri_base) {
                    pi_hole_urls_array.push((new URL(value.pi_uri_base).hostname));
                }
            }))
        }

        if (pi_hole_urls_array.length > 0) {
            excluded_domains = excluded_domains.concat(pi_hole_urls_array);
        }

        // Checking regex
        if (url_validity_regex.test(full_url)) {
            const hostname = new URL(full_url).hostname;
            // Check if url is on the excluded list
            if (!excluded_domains.includes(hostname)) {
                url = hostname
            }
        }
        return url;
    }

    /**
     * Function to reload the current tab
     * @param delay in ms
     */
    public reload_current_tab(delay: number = 0): void {
        const query_info = {
            'active': true,
            'lastFocusedWindow': true,
            'currentWindow': true
        };
        const query_function = (tabs: Tab[]) => {

            if (tabs[0]) {
                this.get_current_tab_url_cleaned().then((url) => {
                    if (url && tabs[0].id) {
                        chrome.tabs.reload(tabs[0].id);
                    }
                });
            }
        };
        const tabs_function = () => chrome.tabs.query(query_info, query_function);

        if (delay > 0) {
            setTimeout(tabs_function, delay);
        } else {
            tabs_function();
        }
    }

    private get_storage_service(): StorageService {
        return ServiceLocator.getInstance().get_storage_service();
    }
}
