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
		const url_validity_regex = new RegExp('^(http|https):\\/\\/[^ "]+$')

		if (url_validity_regex.test(full_url))
		{
			url = new URL(full_url).hostname;
		}
		return url;
	}

}
