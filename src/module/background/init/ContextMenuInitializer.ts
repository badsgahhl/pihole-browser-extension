import {Initializer} from "./Initializer";
import {BadgeService, ExtensionBadgeTextEnum} from "../../../service/browser/BadgeService";
import {PiHoleApiStatusEnum} from "../../../service/api/models/pihole/PiHoleApiStatus";
import {PiHoleSettingsDefaults, StorageService} from "../../../service/browser/StorageService";
import PiHoleApiService from "../../../service/api/service/PiHoleApiService";
import {i18nContextMenuKeys, I18nService} from "../../../service/browser/I18nService";
import {ApiJsonErrorMessages} from "../../../service/api/errors/ApiErrorMessages";
import CreateProperties = chrome.contextMenus.CreateProperties;

export default class ContextMenuInitializer implements Initializer {
    init(): void {
        for (const contextMenusConfiguration of this.contextMenusConfigurations) {
            chrome.contextMenus.create(contextMenusConfiguration);
        }
    }

    private get contextMenusConfigurations(): CreateProperties[] {
        return [
            {
                title: I18nService.translate(i18nContextMenuKeys.toggle_pi_holes), contexts: ["page"], onclick: () => {
                    let newStatus: PiHoleApiStatusEnum;
                    BadgeService.getBadgeText().then((result) => {
                        if (result === ExtensionBadgeTextEnum.disabled) {
                            newStatus = PiHoleApiStatusEnum.enabled;
                        } else if (result === ExtensionBadgeTextEnum.enabled) {
                            newStatus = PiHoleApiStatusEnum.disabled;
                        } else {
                            return;
                        }

                        StorageService.getDefaultDisableTime().then(value => {
                            if (typeof value === "undefined") {
                                value = PiHoleSettingsDefaults.default_disable_time;
                            }

                            PiHoleApiService.changePiHoleStatus(newStatus, value).then((data) => {
                                for (let piHoleStatus of data) {
                                    if (piHoleStatus.data.status === PiHoleApiStatusEnum.error || piHoleStatus.data.status !== newStatus) {
                                        console.warn(ApiJsonErrorMessages.error_returned)
                                        BadgeService.setBadgeText(ExtensionBadgeTextEnum.error);
                                        return;
                                    }
                                }
                                BadgeService.setBadgeText(newStatus === PiHoleApiStatusEnum.disabled ? ExtensionBadgeTextEnum.disabled : ExtensionBadgeTextEnum.enabled);
                            }).catch(reason => {
                                console.warn(reason);
                                BadgeService.setBadgeText(ExtensionBadgeTextEnum.error);
                            });
                        })

                    })
                }
            },
            {
                title: I18nService.translate(i18nContextMenuKeys.blacklist_current_domain),
                contexts: ["page"],
                onclick: () => {
                }
            },
            {
                title: I18nService.translate(i18nContextMenuKeys.whitelist_current_domain),
                contexts: ["page"],
                onclick: () => {
                }
            },
            {
                title: I18nService.translate(i18nContextMenuKeys.open_settings),
                contexts: ["page"],
                onclick: () => chrome.runtime.openOptionsPage()
            }
        ]
    }
}