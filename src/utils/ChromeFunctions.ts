/**
 * Sets the extension icon badge text in chrome.
 * @param text
 */
export function set_badge_text(text:string) {
	chrome.browserAction.setBadgeText({text: text});
}




