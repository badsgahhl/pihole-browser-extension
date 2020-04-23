/**
 * Service Module to access the local chrome storage
 */
export module StorageAccessService
{
	/**
	 * Saves the Object to the local storage.
	 * @param items
	 * @param callback
	 */
	export function save_to_local_storage(items: Object, callback?: () => void): void
	{
		chrome.storage.local.set(items, callback);
	}

	/**
	 * Gets the current extension settings.
	 */
	export function get_pi_hole_settings(): Promise<PiHoleSettingsStorage>
	{
		return new Promise((resolve) => {
			chrome.storage.local.get(null, function(obj) {
				resolve(obj)
			});
		});
	}
}

/**
 * Interface for the local settings storage structure.
 */
export interface PiHoleSettingsStorage
{
	pi_uri_base?: string;
	api_key?: string;
}

