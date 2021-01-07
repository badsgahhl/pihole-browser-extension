import {PiHoleApiStatusEnum} from "../api/enum/PiHoleApiStatusEnum";

/**
 * Service Module for the extension icon badge.
 */
export class BadgeService {

    /**
     * Sets the badge text.
     */
    public static setBadgeText(text: ExtensionBadgeTextEnum): void {
        // Firefox needs white text color.
        if (typeof browser !== 'undefined') {
            browser.browserAction.setBadgeTextColor({color: "white"}).then();
        }

        chrome.browserAction.setBadgeBackgroundColor({color: this.getColorForBadgeTextEnum(text)});

        chrome.browserAction.setBadgeText({text: text});
    }

    /**
     * Returns the badge text as enum value.
     */
    public static getBadgeText(): Promise<ExtensionBadgeTextEnum> {
        return new Promise((resolve) => {
            chrome.browserAction.getBadgeText({}, (result: string) => {
                resolve(this.convertStringToBadgeTextEnum(result));
            })
        });

    }

    /**
     * Compares the badge text with the PiHoleApiStatus
     * Returns false if they are not equal
     */
    public static compareBadgeTextToApiStatusEnum(badge_text: ExtensionBadgeTextEnum, api_status: PiHoleApiStatusEnum): boolean {
        switch (badge_text) {
            case ExtensionBadgeTextEnum.disabled:
                return api_status === PiHoleApiStatusEnum.disabled;
            case ExtensionBadgeTextEnum.enabled:
                return api_status === PiHoleApiStatusEnum.enabled;
            default:
                return false;
        }
    }

    /**
     * Converts an input string to the correct ExtensionBadgeText Enum
     */
    private static convertStringToBadgeTextEnum(input: string): ExtensionBadgeTextEnum {
        switch (input) {
            case ExtensionBadgeTextEnum.disabled:
                return ExtensionBadgeTextEnum.disabled;
            case ExtensionBadgeTextEnum.enabled:
                return ExtensionBadgeTextEnum.enabled
            default:
                return ExtensionBadgeTextEnum.error;
        }
    }

    private static getColorForBadgeTextEnum(input: ExtensionBadgeTextEnum): string {
        switch (input) {
            case ExtensionBadgeTextEnum.disabled:
                return 'gray';
            case ExtensionBadgeTextEnum.enabled:
                return '#1ea23d';
            case ExtensionBadgeTextEnum.ok:
                return '#4577d7';
            default:
                return 'red'
        }
    }
}

export enum ExtensionBadgeTextEnum {
    enabled = 'On',
    disabled = 'Off',
    error = 'Err',
    ok = 'Ok'
}




