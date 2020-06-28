/**
 * Service Module to access the local chrome storage
 */
export module StorageService
{
	/**
	 * Function to save one settings object according to its id
	 * @param settings
	 * @param callback
	 */
	export async function add_pi_hole_settings(settings: PiHoleSettingsStorage, callback?: () => void): Promise<void>
	{
		let current_settings = await get_pi_hole_settings_array();
		if (typeof current_settings !== "undefined" && current_settings.length > 0)
		{
			current_settings.push(settings);
		}
		else
		{
			current_settings = [settings];
		}

		let storage: ExtensionStorage = {
			pi_hole_settings: current_settings,
		}

		if (storage)
		{
			chrome.storage.local.set(storage, callback);
		}

	}

	export function clear_pi_hole_settings(): void
	{
		chrome.storage.local.remove(ExtensionStorageEnum.pi_hole_settings.valueOf());
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

	export function get_default_disable_time(): Promise<number>
	{
		return new Promise((resolve) => {
			chrome.storage.local.get(ExtensionStorageEnum.default_disable_time, function(obj) {
				resolve((<ExtensionStorage> obj).default_disable_time)
			});
		});
	}

	/**
	 * Function to set the state for disable_after_new_tab
	 * @param state
	 */
	export function save_disable_after_new_tab(state: boolean): void
	{
		const storage: ExtensionStorage = {
			disable_after_new_tab: state
		}
		chrome.storage.local.set(storage);
	}

	export function get_disable_after_new_tab(): Promise<boolean>
	{
		return new Promise((resolve) => {
			chrome.storage.local.get(ExtensionStorageEnum.disable_after_new_tab, function(obj) {
				resolve((<ExtensionStorage> obj).disable_after_new_tab)
			});
		});
	}

	/**
	 * Function to set the state for reload_after_enable_disable
	 * @param state
	 */
	export function save_reload_after_enable_disable(state: boolean): void
	{
		const storage: ExtensionStorage = {
			reload_after_enable_disable: state
		}
		chrome.storage.local.set(storage);
	}

	export function get_reload_after_enable_disable(): Promise<boolean>
	{
		return new Promise((resolve) => {
			chrome.storage.local.get(ExtensionStorageEnum.reload_after_enable_disable, function(obj) {
				resolve((<ExtensionStorage> obj).reload_after_enable_disable)
			});
		});
	}

	/**
	 * Function to set the state for reload_after_white_black_list
	 * @param state
	 */
	export function save_reload_after_white_black_list(state: boolean): void
	{
		const storage: ExtensionStorage = {
			reload_after_white_black_list: state
		}
		chrome.storage.local.set(storage);
	}

	export function get_reload_after_white_black_list(): Promise<boolean>
	{
		return new Promise((resolve) => {
			chrome.storage.local.get(ExtensionStorageEnum.reload_after_white_black_list, function(obj) {
				resolve((<ExtensionStorage> obj).reload_after_white_black_list)
			});
		});
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

	export function get_pi_hole_settings_array(): Promise<PiHoleSettingsStorage[]> | undefined
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
			const migration_storage: PiHoleSettingsStorage = {
				pi_uri_base: oldStorage.pi_uri_base,
				api_key: oldStorage.api_key
			}

			add_pi_hole_settings(migration_storage);
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
	storage_version?: number,
	disable_after_new_tab?: boolean,
	reload_after_enable_disable?: boolean,
	reload_after_white_black_list?: boolean,
}

export enum ExtensionStorageEnum
{
	pi_hole_settings = 'pi_hole_settings',
	storage_version = 'storage_version',
	default_disable_time = 'default_disable_time',
	disable_after_new_tab = 'disable_after_new_tab',
	reload_after_enable_disable = 'reload_after_enable_disable',
	reload_after_white_black_list = 'reload_after_white_black_list'

}
