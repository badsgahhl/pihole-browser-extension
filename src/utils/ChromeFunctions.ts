/**
 * Sets the extension icon badge text in chrome.
 * @param text
 */
import {ExtensionBadgeText} from "../data/storage/StorageAccess.js";
import {PiHoleApiStatusEnum} from "../data/api/models/pihole/PiHoleApiStatus.js";

export module ChromeFunctions {

	export function set_badge_text(text:ExtensionBadgeText) {
		chrome.browserAction.setBadgeText({text: text});
	}

	export function get_badge_text():Promise<string> {
		return new Promise((resolve) => {
			chrome.browserAction.getBadgeText({}, function(result:string) {
				resolve(result);
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
	export function compare_badge_to_api_status(badge_text:string, api_status:PiHoleApiStatusEnum):boolean {
		switch (badge_text) {
			case ExtensionBadgeText.disabled:
				return api_status === PiHoleApiStatusEnum.disabled;
			case ExtensionBadgeText.enabled:
				return api_status === PiHoleApiStatusEnum.enabled;
			default:
				return false;
		}
	}
}




