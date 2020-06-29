import {StorageService} from "./StorageService";

export module TabService
{
	/**
	 * Returns the current tab url. Cleaned only the real domain without the parameters etc.
	 */
	export async function get_current_tab_url_cleaned(): Promise<string>
	{
		const current_tab_url_promise: Promise<string> = new Promise((resolve) => {
			chrome.tabs.query({'active': true, 'lastFocusedWindow': true, 'currentWindow': true}, function(tabs) {
				if (tabs[0])
				{
					const tab_url = tabs[0].url;
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

		let pi_hole_urls = (await StorageService.get_pi_hole_settings_array());
		let pi_hole_urls_array = [];
		if (typeof pi_hole_urls !== "undefined")
		{
			pi_hole_urls.forEach((value => {
				pi_hole_urls_array.push((new URL(value.pi_uri_base).hostname));
			}))
		}

		if (pi_hole_urls_array.length > 0)
		{
			excluded_domains = excluded_domains.concat(pi_hole_urls_array);
		}

		// Checking regex
		if (url_validity_regex.test(full_url))
		{
			const hostname = new URL(full_url).hostname;
			// Check if url is on the excluded list
			if (!excluded_domains.includes(hostname))
			{
				url = hostname
			}
		}
		return url;
	}

	/**
	 * Function to reload the current tab
	 */
	export function reload_current_tab(): void
	{
		chrome.tabs.query({'active': true, 'lastFocusedWindow': true, 'currentWindow': true}, (tabs) => {
			if (tabs[0])
			{
				get_current_tab_url_cleaned().then((url) => {
					if (url)
					{
						chrome.tabs.reload(tabs[0].id);
					}
				});
			}
		});
	}
}
