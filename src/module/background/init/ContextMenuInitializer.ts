import {Initializer} from "./Initializer";
import {BadgeService, ExtensionBadgeTextEnum} from "../../../service/browser/BadgeService";
import {PiHoleApiStatusEnum} from "../../../service/api/models/pihole/PiHoleApiStatus";
import {PiHoleSettingsDefaults, StorageService} from "../../../service/browser/StorageService";
import PiHoleApiService from "../../../service/api/service/PiHoleApiService";
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
                title: "Toggle PiHole", contexts: ["page"], onclick: () => {
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

                            PiHoleApiService.changePiHoleStatus(newStatus, value).then(() => {
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
                title: "Blacklist current domain", contexts: ["page"], onclick: () => {
                }
            },
            {
                title: "Whitelist current domain", contexts: ["page"], onclick: () => {
                }
            },
            {
                title: "Open Settings", contexts: ["page"], onclick: () => {
                }
            }
        ]
    }
}