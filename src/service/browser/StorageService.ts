/**
 * Service Module to access the local chrome storage
 */
export class StorageService
{
	/**
	 * Function to save a pi_hole settings array
	 * @param settings
	 */
	public save_pi_hole_settings_array(settings: PiHoleSettingsStorage[]): void
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

	/**
	 * Function to disable the default disable time
	 * @param time
	 */
	public save_default_disable_time(time: number): void
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

	public get_default_disable_time(): Promise<number | undefined>
	{
		return this.get_storage_value<number>(ExtensionStorageEnum.default_disable_time);
	}

	/**
	 * Function to set the state for reload_after_enable_disable
	 * @param state
	 */
	public save_reload_after_disable(state: boolean): void
	{
		const storage: ExtensionStorage = {
			reload_after_disable: state
		}
		chrome.storage.local.set(storage);
	}

	public get_reload_after_disable(): Promise<boolean | undefined>
	{
		return this.get_storage_value<boolean>(ExtensionStorageEnum.reload_after_disable);
	}

	/**
	 * Function to set the state for reload_after_white_black_list
	 * @param state
	 */
	public save_reload_after_white_list(state: boolean): void
	{
		const storage: ExtensionStorage = {
			reload_after_white_list: state
		}
		chrome.storage.local.set(storage);
	}

	public get_reload_after_white_list(): Promise<boolean | undefined>
	{
		return this.get_storage_value<boolean>(ExtensionStorageEnum.reload_after_white_list);
	}


	public get_pi_hole_settings_array(): Promise<PiHoleSettingsStorage[] | undefined>
	{
		return this.get_storage_value<PiHoleSettingsStorage[]>(ExtensionStorageEnum.pi_hole_settings);
	}

	/**
	 * Base Function to get data from the storage
	 * @param key
	 */
	private get_storage_value<T>(key: ExtensionStorageEnum): Promise<T | undefined>
	{
		return new Promise<T | undefined>((resolve) => {
			chrome.storage.local.get(key, function(obj) {
				resolve(obj[key]);
			});
		});
	}

}

export interface PiHoleSettingsStorage
{
	pi_uri_base?: string;
	api_key?: string;
}

export enum PiHoleSettingsDefaults
{
	pi_uri_base = 'http://pi.hole/admin',
	default_disable_time = 10
}

export interface ExtensionStorage
{
	pi_hole_settings?: PiHoleSettingsStorage[],
	default_disable_time?: number,
	reload_after_disable?: boolean,
	reload_after_white_list?: boolean,
	beta_feature_flag?: boolean
}

export enum ExtensionStorageEnum
{
	pi_hole_settings = 'pi_hole_settings',
	default_disable_time = 'default_disable_time',
	reload_after_disable = 'reload_after_disable',
	reload_after_white_list = 'reload_after_white_list',
}
