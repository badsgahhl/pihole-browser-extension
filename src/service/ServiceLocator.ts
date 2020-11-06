import {i18nService} from "./browser/i18nService";
import {StorageService} from "./browser/StorageService";
import {BadgeService} from "./browser/BadgeService";
import {TabService} from "./browser/TabService";
import {PiHoleApiService} from "./api/service/PiHoleApiService";

export default class ServiceLocator {

    private static instance: ServiceLocator | null = null;
    private i18n_service: i18nService | null = null;
    private storage_service: StorageService | null = null;
    private badge_service: BadgeService | null = null;
    private tab_service: TabService | null = null;
    private api_service: PiHoleApiService | null = null;

    private constructor() {
    }

    public static getInstance(): ServiceLocator {
        if (!(ServiceLocator.instance instanceof ServiceLocator)) {
            ServiceLocator.instance = new ServiceLocator();
        }

        return ServiceLocator.instance;
    }

    public get_i18n_service(): i18nService {
        if (!(this.i18n_service instanceof i18nService)) {
            this.i18n_service = new i18nService();
        }

        return this.i18n_service;
    }

    public get_storage_service(): StorageService {
        if (!(this.storage_service instanceof StorageService)) {
            this.storage_service = new StorageService();
        }

        return this.storage_service;
    }

    public get_badge_service(): BadgeService {
        if (!(this.badge_service instanceof BadgeService)) {
            this.badge_service = new BadgeService();
        }

        return this.badge_service;
    }

    public get_tab_service(): TabService {
        if (!(this.tab_service instanceof TabService)) {
            this.tab_service = new TabService();
        }

        return this.tab_service;
    }

    public get_api_service(): PiHoleApiService {
        if (!(this.api_service instanceof PiHoleApiService)) {
            this.api_service = new PiHoleApiService();
        }

        return this.api_service;
    }


}
