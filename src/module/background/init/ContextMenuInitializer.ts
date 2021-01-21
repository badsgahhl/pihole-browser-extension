import {Initializer} from "../../general/Initializer";
import {i18nContextMenuKeys, i18nService} from "../../../service/i18nService";
import {BackgroundService} from "../../../service/BackgroundService";
import {ContextMenuSwitchMessage, MessageEnum} from "../../../service/MessageBusService";
import {StorageService} from "../../../service/StorageService";
import CreateProperties = chrome.contextMenus.CreateProperties;

export default class ContextMenuInitializer implements Initializer {
    init(): void {
        StorageService.getDisableContextMenu().then(value => {
            this.removeOrCreateContextMenuByBoolean(value);
        });
        this.initMessageListener();
    }


    private initMessageListener(): void {
        chrome.runtime.onMessage.addListener((request: ContextMenuSwitchMessage) => {
            if (request.message === MessageEnum.ContextMenuSwitch) {
                this.removeOrCreateContextMenuByBoolean(request.payload);
            }
        })
    }

    private removeOrCreateContextMenuByBoolean(state: boolean): void {
        if (!state) {
            this.createContextMenu();
        } else {
            chrome.contextMenus.removeAll();
        }
    }

    private createContextMenu(): void {
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