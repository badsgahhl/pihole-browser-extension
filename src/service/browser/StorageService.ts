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

	/**
	 * Function to save a pi_hole settings array
	 * @param settings
	 */
	export function save_pi_hole_settings_array(settings: PiHoleSettingsStorage[]): void
	{
		if (settings.length > 0)
		{
			let filtered_settings: PiHoleSettingsStorage[] = settings.filter(value => value.pi_uri_base);

			if (filtered_settings.length < 1)
			{
				chrome.storage.local.remove(ExtensionStorageEnum.pi_hole_settings);
				return;
			}

			let secure_settings: PiHoleSettingsStorage[] = [];

			// Type Assertion
			for (const setting of filtered_settings)
			{
				const secure_setting: PiHoleSettingsStorage = {};

				secure_setting.pi_uri_base = String(setting.pi_uri_base);
				secure_setting.api_key = String(setting.api_key);

				secure_settings.push(secure_setting);
			}

			const storage: ExtensionStorage = {
				pi_hole_settings: secure_settings
			};

			chrome.storage.local.set(storage);
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
		time = Number(time);
		if (time < 1)
		{
			return;
		}
		const storage: ExtensionStorage = {
			default_disable_time: time
		}
		chrome.storage.local.set(storage);
	}

	export function get_default_disable_time(): Promise<number | undefined>
	{
		return new Promise((resolve) => {
			chrome.storage.local.get(ExtensionStorageEnum.default_disable_time, function(obj) {
				resolve((<ExtensionStorage> obj).default_disable_time)
			});
		});
	}

	/**
	 * Enable disable beta feature
	 * @param value
	 */
	export function save_beta_feature_flag(value: boolean): void
	{
		const storage: ExtensionStorage = {
			beta_feature_flag: value
		}
		chrome.storage.local.set(storage);
	}

	/**
	 * Gets the status of the beta feature
	 */
	export function get_beta_feature_flag(): Promise<boolean | undefined>
	{
		return new Promise((resolve) => {
			chrome.storage.local.get(ExtensionStorageEnum.beta_feature_flag, function(obj) {
				resolve((<ExtensionStorage> obj).beta_feature_flag)
			});
		});
	}

	/**
	 * Function to set the state for reload_after_enable_disable
	 * @param state
	 */
	export function save_reload_after_disable(state: boolean): void
	{
		const storage: ExtensionStorage = {
			reload_after_disable: state
		}
		chrome.storage.local.set(storage);
	}

	export function get_reload_after_disable(): Promise<boolean | undefined>
	{
		return new Promise((resolve) => {
			chrome.storage.local.get(ExtensionStorageEnum.reload_after_disable, function(obj) {
				resolve((<ExtensionStorage> obj).reload_after_disable)
			});
		});
	}

	/**
	 * Function to set the state for reload_after_white_black_list
	 * @param state
	 */
	export function save_reload_after_white_list(state: boolean): void
	{
		const storage: ExtensionStorage = {
			reload_after_white_list: state
		}
		chrome.storage.local.set(storage);
	}

	export function get_reload_after_white_list(): Promise<boolean | undefined>
	{
		return new Promise((resolve) => {
			chrome.storage.local.get(ExtensionStorageEnum.reload_after_white_list, function(obj) {
				resolve((<ExtensionStorage> obj).reload_after_white_list)
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

	export function get_pi_hole_settings_array(): Promise<PiHoleSettingsStorage[] | undefined>
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
			const old_default_disable_time = oldStorage.default_disable_time;
			if (old_default_disable_time)
			{
				save_default_disable_time(old_default_disable_time);
			}
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
	reload_after_disable?: boolean,
	reload_after_white_list?: boolean,
	beta_feature_flag?: boolean
}

export enum ExtensionStorageEnum
{
	pi_hole_settings = 'pi_hole_settings',
	storage_version = 'storage_version',
	default_disable_time = 'default_disable_time',
	reload_after_disable = 'reload_after_disable',
	reload_after_white_list = 'reload_after_white_list',
	beta_feature_flag = 'beta_feature_flag'
}
