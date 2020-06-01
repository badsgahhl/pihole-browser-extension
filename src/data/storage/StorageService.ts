/**
 * Service Module to access the local chrome storage
 */
export module StorageService
{
	/**
	 * Saves the Object to the local storage.
	 * @param items
	 * @param callback
	 * @deprecated
	 */
	export function save_to_local_storage(items: Object, callback?: () => void): void
	{
		chrome.storage.local.set(items, callback);
	}

	/**
	 * Function to save one settings object according to its id
	 * @param settings
	 * @param id
	 * @param callback
	 */
	export function save_pi_hole_settings(settings: PiHoleSettingsStorage, id: number, callback?: () => void): void
	{
		get_pi_hole_settings_array().then(r => {
			r[id] = settings;

			const storage: ExtensionStorage = {
				storage_version: 2,
				pi_hole_settings: r
			}

			chrome.storage.local.set(storage, callback);
		})
	}

	/**
	 * Function to disable the default disable time
	 * @param time
	 */
	export function save_default_disable_time(time: number): void
	{
		if (time < 1)
		{
			return;
		}
		const storage: ExtensionStorage = {
			default_disable_time: time
		}
		chrome.storage.local.set(storage);
	}

	/**
	 * Gets the current extension settings.
	 * @deprecated
	 */
	export function get_pi_hole_settings(): Promise<PiHoleSettingsStorageOld>
	{
		return new Promise((resolve) => {
			chrome.storage.local.get(null, function(obj) {
				resolve(obj)
			});
		});
	}

	export function get_pi_hole_settings_array(): Promise<PiHoleSettingsStorage[]>
	{
		return new Promise((resolve) => {
			chrome.storage.local.get(ExtensionStorageEnum.pi_hole_settings, function(obj) {
				resolve((<ExtensionStorage> obj).pi_hole_settings)
			});
		});
	}


	/**
	 * Function to migrate the local storage to the new version for supporting multiple piholes
	 */
	export function process_storage_migration(): void
	{
		get_pi_hole_settings().then(oldStorage => {
			chrome.storage.local.clear();
			save_pi_hole_settings(oldStorage, 0);
			save_default_disable_time(oldStorage.default_disable_time);
		})

	}
}

/**
 * Interface for the local settings storage structure.
 */
export interface PiHoleSettingsStorageOld
{
	pi_uri_base?: string;
	api_key?: string;
	default_disable_time?: number;
}

export interface PiHoleSettingsStorage
{
	pi_uri_base?: string;
	api_key?: string;
}

export enum PiHoleSettingsDefaults
{
	pi_uri_base = 'http://pi.hole/admin',
	api_key = '',
	default_disable_time = 10
}

export interface ExtensionStorage
{
	pi_hole_settings?: PiHoleSettingsStorage[],
	default_disable_time?: number,
	storage_version?: number
}

export enum ExtensionStorageEnum
{
	pi_hole_settings = 'pi_hole_settings',
	storage_version = 'storage_version'
}
