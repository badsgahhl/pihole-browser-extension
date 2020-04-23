import {PiHoleApiStatusEnum} from "../api/models/pihole/PiHoleApiStatus.js";

/**
 * Service Module for the extension icon badge.
 */
export module BadgeService
{

	/**
	 * Sets the badge text.
	 * @param text
	 */
	export function set_badge_text(text: ExtensionBadgeText)
	{
		chrome.browserAction.setBadgeText({text: text});
	}

	/**
	 * Returns the badge text as enum value.
	 */
	export function get_badge_text(): Promise<ExtensionBadgeText>
	{
		return new Promise((resolve) => {
			chrome.browserAction.getBadgeText({}, function(result: string) {
				resolve(convert_string_to_badge_text(result));
			})
		});

	}

	/**
	 * Converts an input string to the correct ExtensionBadgeText Enum
	 * @param input
	 */
	function convert_string_to_badge_text(input: string): ExtensionBadgeText
	{
		switch (input)
		{
			case ExtensionBadgeText.disabled:
				return ExtensionBadgeText.disabled;
			case ExtensionBadgeText.enabled:
				return ExtensionBadgeText.enabled
			default:
				return ExtensionBadgeText.error;
		}
	}

	/**
	 * Compares the badge text with the PiHoleApiStatus
	 * Returns false if they are not equal
	 *
	 * @param badge_text
	 * @param api_status
	 */
	export function compare_badge_to_api_status(badge_text: ExtensionBadgeText, api_status: PiHoleApiStatusEnum): boolean
	{
		switch (badge_text)
		{
			case ExtensionBadgeText.disabled:
				return api_status === PiHoleApiStatusEnum.disabled;
			case ExtensionBadgeText.enabled:
				return api_status === PiHoleApiStatusEnum.enabled;
			default:
				return false;
		}
	}
}

export enum ExtensionBadgeText
{
	enabled = 'On',
	disabled = 'Off',
	error = 'Error'
}




