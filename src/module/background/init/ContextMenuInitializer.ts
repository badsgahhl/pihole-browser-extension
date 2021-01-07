import {Initializer} from "../../general/Initializer";
import {i18nContextMenuKeys, i18nService} from "../../../service/i18nService";
import {BackgroundService} from "../../../service/BackgroundService";
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
                title: i18nService.translate(i18nContextMenuKeys.toggle_pi_holes), contexts: ["page"], onclick: () => {
                    BackgroundService.togglePiHole();
                }
            },
            {
                type: "separator",
                contexts: ["page"]
            },
            {
                title: i18nService.translate(i18nContextMenuKeys.blacklist_current_domain),
                contexts: ["page"],
                onclick: () => {
                    BackgroundService.blacklistCurrentDomain();
                }
            },
            {
                title: i18nService.translate(i18nContextMenuKeys.whitelist_current_domain),
                contexts: ["page"],
                onclick: () => {
                    BackgroundService.whitelistCurrentDomain();
                }
            },
            {
                type: "separator",
                contexts: ["page"]
            },
            {
                title: i18nService.translate(i18nContextMenuKeys.open_settings),
                contexts: ["page"],
                onclick: () => BackgroundService.openOptions()
            }
        ]
    }
}