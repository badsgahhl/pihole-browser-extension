import {PiHoleApiStatusEnum} from "../api/enum/PiHoleApiStatusEnum";
import {BadgeService, ExtensionBadgeTextEnum} from "./BadgeService";
import {PiHoleSettingsDefaults, StorageService} from "./StorageService";
import PiHoleApiService from "./PiHoleApiService";
import {TabService} from "./TabService";
import {ApiList} from "../api/enum/ApiList";

export class BackgroundService {
    public static togglePiHole(): void {
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

    public static blacklistCurrentDomain(): void {
        TabService.getCurrentTabUrlCleaned().then(url => {
            if (url.length < 1) {
                return;
            }
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

    public static whitelistCurrentDomain(): void {
        TabService.getCurrentTabUrlCleaned().then(url => {
            if (url.length < 1) {
                return;
            }
            PiHoleApiService.subDomainFromList(ApiList.blacklist, url).then(() => {
                PiHoleApiService.addDomainToList(ApiList.whitelist, url).then(value => {
                    StorageService.getReloadAfterWhitelist().then(state => {
                        if (typeof state == 'undefined') {
                            return;
                        }
                        if (state) {
                            for (const response of value) {
                                if (response.data.message.includes('Added')) {
                                    TabService.reloadCurrentTab(1500);
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

    public static openOptions(): void {
        chrome.runtime.openOptionsPage()
    }
}