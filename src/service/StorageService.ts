export interface PiHoleSettingsStorage {
  pi_uri_base?: string;
  api_key?: string;
}

export enum PiHoleSettingsDefaults {
  pi_uri_base = 'http://pi.hole/admin',
  default_disable_time = 10
}

export interface ExtensionStorage {
  pi_hole_settings?: PiHoleSettingsStorage[];
  default_disable_time?: number;
  reload_after_disable?: boolean;
  reload_after_white_list?: boolean;
  disable_list_feature?: boolean;
  disable_update_notification?: boolean;
  beta_feature_flag?: boolean;
  disable_context_menu?: boolean;
}

export enum ExtensionStorageEnum {
  pi_hole_settings = 'pi_hole_settings',
  default_disable_time = 'default_disable_time',
  reload_after_disable = 'reload_after_disable',
  reload_after_white_list = 'reload_after_white_list',
  disable_list_feature = 'disable_list_feature',
  disable_update_notification = 'disable_update_notification',
  disable_context_menu = 'disable_context_menu',
  session_storage = 'session_storage'
}

type Postfix = string
type ExtensionStorageEnumWithPostfix = `${ExtensionStorageEnum}_${Postfix}`
type MaybeExtensionStorageEnum = ExtensionStorageEnum | ExtensionStorageEnumWithPostfix
type StorageValue<T> = {
  value: T,
}

export class StorageService {
  public static async savePiHoleSettingsArray(
    settings: PiHoleSettingsStorage[],
  ) {
    if (settings.length > 0) {
      const filteredSettings: PiHoleSettingsStorage[] = settings.filter(
        value => value.pi_uri_base,
      );

      if (filteredSettings.length < 1) {
        chrome.storage.local.remove(ExtensionStorageEnum.pi_hole_settings);
        return;
      }

      const secureSettings: PiHoleSettingsStorage[] = [];

      // Type Assertion
      for (const setting of filteredSettings) {
        const secureSetting: PiHoleSettingsStorage = {};

        secureSetting.pi_uri_base = String(setting.pi_uri_base);
        secureSetting.api_key = String(setting.api_key);

        secureSettings.push(secureSetting);
        // Reset the session
        // eslint-disable-next-line no-await-in-loop
        await this.removeSid(setting.pi_uri_base!);
      }

      const storage: ExtensionStorage = {
        pi_hole_settings: secureSettings,
      };

      await chrome.storage.local.set(storage);
    }
  }

  public static saveDefaultDisableTime(time: number): void {
    if (time < 1) {
      return;
    }
    const storage: ExtensionStorage = {
      default_disable_time: time,
    };
    chrome.storage.local.set(storage);
  }

  public static getDefaultDisableTime(): Promise<number | undefined> {
    return this.getStorageValue<number>(
      ExtensionStorageEnum.default_disable_time,
    );
  }

  public static saveReloadAfterDisable(state: boolean): void {
    const storage: ExtensionStorage = {
      reload_after_disable: state,
    };
    chrome.storage.local.set(storage);
  }

  public static getReloadAfterDisable(): Promise<boolean | undefined> {
    return this.getStorageValue<boolean>(
      ExtensionStorageEnum.reload_after_disable,
    );
  }

  public static saveReloadAfterWhitelist(state: boolean): void {
    const storage: ExtensionStorage = {
      reload_after_white_list: state,
    };
    chrome.storage.local.set(storage);
  }

  public static getReloadAfterWhitelist(): Promise<boolean | undefined> {
    return this.getStorageValue<boolean>(
      ExtensionStorageEnum.reload_after_white_list,
    );
  }

  public static getPiHoleSettingsArray(): Promise<
    PiHoleSettingsStorage[] | undefined
  > {
    return this.getStorageValue<PiHoleSettingsStorage[]>(
      ExtensionStorageEnum.pi_hole_settings,
    );
  }

  public static getDisableListFeature(): Promise<boolean | undefined> {
    return this.getStorageValue<boolean>(
      ExtensionStorageEnum.disable_list_feature,
    );
  }

  public static saveDisableListFeature(state: boolean): void {
    const storage: ExtensionStorage = {
      disable_list_feature: state,
    };
    chrome.storage.local.set(storage);
  }

  public static getDisableContextMenu(): Promise<boolean> {
    return this.getStorageValue<boolean>(
      ExtensionStorageEnum.disable_context_menu,
      false,
    );
  }

  public static saveDisableContextMenu(state: boolean): void {
    const storage: ExtensionStorage = {
      disable_context_menu: state,
    };
    chrome.storage.local.set(storage);
  }

  public static async getSid(url: string): Promise<string | undefined> {
    const baseUrl = new URL(url).origin;
    const key: MaybeExtensionStorageEnum = `${ExtensionStorageEnum.session_storage}_${baseUrl}`;
    const value = await this.getStorageValue<StorageValue<string>>(key);

    return value?.value;
  }

  public static async saveSid(url: string, sid: string): Promise<void> {
    const baseUrl = new URL(url).origin;
    const key: MaybeExtensionStorageEnum = `${ExtensionStorageEnum.session_storage}_${baseUrl}`;
    const value: StorageValue<string> = {
      value: sid,
    };
    await chrome.storage.local.set({ [key]: value });
  }

  public static async removeSid(url: string): Promise<void> {
    const baseUrl = new URL(url).origin;
    const key: MaybeExtensionStorageEnum = `${ExtensionStorageEnum.session_storage}_${baseUrl}`;
    await chrome.storage.local.remove(key);
  }

  public static async clearStorage() {
    return chrome.storage.local.clear();
  }

  private static getStorageValue<T>(
    key: MaybeExtensionStorageEnum,
  ): Promise<T | undefined>

  private static getStorageValue<T>(
    key: MaybeExtensionStorageEnum,
    defaultUnsetValue: T,
  ): Promise<T>

  private static getStorageValue<T>(
    key: MaybeExtensionStorageEnum,
    defaultUnsetValue?: T,
  ): Promise<T | undefined> | Promise<T> {
    return new Promise(resolve => {
      chrome.storage.local.get(key, obj => {
        const storageValue: T | undefined = obj[key];

        if (
          typeof defaultUnsetValue !== 'undefined' &&
          typeof storageValue === 'undefined'
        ) {
          resolve(defaultUnsetValue);
        }

        resolve(storageValue);
      });
    });
  }
}
