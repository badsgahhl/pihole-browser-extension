import {StorageAccessService} from "./StorageAccessService";

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
					const url = tabs[0].url;
					resolve(url);
				}
			});
		});
		let url = '';
		let full_url = (await current_tab_url_promise);
		const url_validity_regex = new RegExp('^(http|https):\\/\\/[^ "]+$');
		const pi_hole_url = (await StorageAccessService.get_pi_hole_settings()).pi_uri_base;

		// Domains that should not be listed anyway.
		const excluded_domains: Array<string> = [
			new URL(pi_hole_url).hostname,
			'localhost',
			'127.0.0.1',
			'pi.hole'
		]
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

}
