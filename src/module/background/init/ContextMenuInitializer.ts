import {Initializer} from "../../general/Initializer";
import {BadgeService, ExtensionBadgeTextEnum} from "../../../service/BadgeService";
import {PiHoleSettingsDefaults, StorageService} from "../../../service/StorageService";
import PiHoleApiService from "../../../service/PiHoleApiService";
import {i18nContextMenuKeys, I18nService} from "../../../service/I18nService";
import {TabService} from "../../../service/TabService";
import {ApiList} from "../../../api/enum/ApiList";
import {PiHoleApiStatusEnum} from "../../../api/enum/PiHoleApiStatusEnum";
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
                                        console.warn('One PiHole returned Error from its request. Please check the API Key.')
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
                type: "separator",
                contexts: ["page"]
            },
            {
                title: I18nService.translate(i18nContextMenuKeys.blacklist_current_domain),
                contexts: ["page"],
                onclick: () => {
                    TabService.getCurrentTabUrlCleaned().then(url => {
                        PiHoleApiService.subDomainFromList(ApiList.whitelist, url).then(() => {
                            PiHoleApiService.addDomainToList(ApiList.blacklist, url).then(() => {
                                BadgeService.setBadgeText(ExtensionBadgeTextEnum.ok);
                            }).catch(reason => {
                                console.warn(reason);
                                BadgeService.setBadgeText(ExtensionBadgeTextEnum.error);
                            })
                        }).catch(reason => {
                            console.warn(reason);
                            BadgeService.setBadgeText(ExtensionBadgeTextEnum.error);
                        });
                    });
                }
            },
            {
                title: I18nService.translate(i18nContextMenuKeys.whitelist_current_domain),
                contexts: ["page"],
                onclick: () => {
                    TabService.getCurrentTabUrlCleaned().then(url => {
                        PiHoleApiService.subDomainFromList(ApiList.blacklist, url).then(() => {
                            PiHoleApiService.addDomainToList(ApiList.whitelist, url).then(value => {
                                StorageService.getReloadAfterWhitelist().then(state => {
                                    if (typeof state == 'undefined') {
                                        return;
                                    }
                                    if (state) {
                                        for (const response of value) {
                                            if (response.data.message.includes('Added')) {
                                                TabService.reloadCurrentTab(1000);
                                            }
                                        }
                                    }
                                })
                                BadgeService.setBadgeText(ExtensionBadgeTextEnum.ok);
                            }).catch(reason => {
                                console.warn(reason);
                                BadgeService.setBadgeText(ExtensionBadgeTextEnum.error);
                            })
                        }).catch(reason => {
                            console.warn(reason);
                            BadgeService.setBadgeText(ExtensionBadgeTextEnum.error);
                        });
                    });
                }
            },
            {
                type: "separator",
                contexts: ["page"]
            },
            {
                title: I18nService.translate(i18nContextMenuKeys.open_settings),
                contexts: ["page"],
                onclick: () => chrome.runtime.openOptionsPage()
            }
        ]
    }
}