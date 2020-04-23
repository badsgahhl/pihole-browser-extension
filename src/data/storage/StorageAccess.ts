/**
 * Reads the Settings from the local extension storage.
 */

export module StorageAccess
{
	export function get_pi_hole_settings():Promise<PiHoleSettingsStorage>
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
	pi_uri_base?:string;
	api_key?:string;
}

