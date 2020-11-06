import {PiHoleApiStatusEnum} from "../api/models/pihole/PiHoleApiStatus";

/**
 * Service Module for the extension icon badge.
 */
export class BadgeService {

    /**
     * Sets the badge text.
     * @param text
     */
    public set_badge_text(text: ExtensionBadgeText): void {
        // Firefox needs white text color.
        if (typeof browser !== 'undefined') {
            browser.browserAction.setBadgeTextColor({color: "white"}).then();
        }

        chrome.browserAction.setBadgeBackgroundColor({color: this.get_color_for_badge_text(text)});

        chrome.browserAction.setBadgeText({text: text});
    }

    /**
     * Returns the badge text as enum value.
     */
    public get_badge_text(): Promise<ExtensionBadgeText> {
        return new Promise((resolve) => {
            chrome.browserAction.getBadgeText({}, (result: string) => {
                resolve(this.convert_string_to_badge_text(result));
            })
        });

    }

    /**
     * Compares the badge text with the PiHoleApiStatus
     * Returns false if they are not equal
     *
     * @param badge_text
     * @param api_status
     */
    public compare_badge_to_api_status(badge_text: ExtensionBadgeText, api_status: PiHoleApiStatusEnum): boolean {
        switch (badge_text) {
            case ExtensionBadgeText.disabled:
                return api_status === PiHoleApiStatusEnum.disabled;
            case ExtensionBadgeText.enabled:
                return api_status === PiHoleApiStatusEnum.enabled;
            default:
                return false;
        }
    }

    /**
     * Converts an input string to the correct ExtensionBadgeText Enum
     * @param input
     */
    private convert_string_to_badge_text(input: string): ExtensionBadgeText {
        switch (input) {
            case ExtensionBadgeText.disabled:
                return ExtensionBadgeText.disabled;
            case ExtensionBadgeText.enabled:
                return ExtensionBadgeText.enabled
            default:
                return ExtensionBadgeText.error;
        }
    }

    private get_color_for_badge_text(input: ExtensionBadgeText): string {
        switch (input) {
            case ExtensionBadgeText.disabled:
                return 'gray';
            case ExtensionBadgeText.enabled:
                return '#1ea23d';
            default:
                return 'red'
        }
    }
}

export enum ExtensionBadgeText {
    enabled = 'On',
    disabled = 'Off',
    error = 'Err'
}




