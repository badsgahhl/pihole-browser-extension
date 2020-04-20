/**
 * Reads the Settings from the local extension storage.
 */
export function read_pi_hole_storage():Promise<PiHoleStorageAccess> {
	return new Promise((resolve) => {
		chrome.storage.local.get(null, function(obj) {
			resolve(obj)
		});
	});
}

/**
 * Interface for the local storage structure.
 */
export interface PiHoleStorageAccess {
	pi_uri_base?:string;
	api_key?:string;
}
