class StorageAccess {
	read(key) {
		return new Promise((resolve, reject) => {
			if (key != null) {
				chrome.storage.local.get(key, function(obj) {
					resolve(obj[key])
				});
			} else {
				reject(null);
			}
		});
	}
}

export function get_storage_access() {
	return new StorageAccess();
}

export const PiHoleStorage = {
	URI: 'pi_uri_base',
	API_KEY: 'api_key',
};
