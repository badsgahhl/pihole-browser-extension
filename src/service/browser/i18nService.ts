export class i18nService
{
	/**
	 * Wrapper Function for the chrome.i18n.getMessage Function
	 * @param key
	 * @param substitutions
	 */
	public translate(key: string, substitutions?: any): string
	{
		return chrome.i18n.getMessage(key, substitutions);
	}
}

export enum i18nOptionsKeys
{
	options_title = "options_title",
	options_settings = "options_settings",
	options_about = "options_about",
	options_report_error = "options_report_error",
	options_about_licences = "options_about_licences",
	option_report_error_github = "option_report_error_github",
	option_troubleshooting = "option_troubleshooting",
	option_extension = "option_extension",
	option_about_copy_debug = "option_about_copy_debug",
	option_contributors = "option_contributors",
	options_headline_info = "options_headline_info",
	options_default_time_label = "options_default_time_label",
	options_default_time_unit = "options_default_time_unit",
	options_reload_after_disable = "options_reload_after_disable",
	options_reload_after_white_list = "options_reload_after_white_list",
	options_api_key = "options_api_key",
	options_pi_hole_address = "options_pi_hole_address",
	options_add_button = "options_add_button",
	options_remove_button = "options_remove_button",
	options_api_key_invalid_warning = "options_api_key_invalid_warning",
	options_beta_feature_flag = "options_beta_feature_flag",
	options_url_invalid_warning = "options_url_invalid_warning",
	option_donation = "option_donation"
}

export enum i18nPopupKeys
{
	popup_title = "popup_title",
	popup_status_card_title = "popup_status_card_title",
	popup_status_card_info_text = "popup_status_card_info_text",
	popup_second_card_current_url = "popup_second_card_current_url",
	popup_second_card_whitelist = "popup_second_card_whitelist",
	popup_second_card_blacklist = "popup_second_card_blacklist",
	popup_update_card_info = "popup_update_card_info"
}

export enum LinkConfig
{
	paypal_donation_link = 'https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=3H9XJUKXMSG22&source=url',
	github_troubleshooting = 'https://github.com/badsgahhl/pihole-browser-extension#troubleshooting',
	uninstall_survey = 'https://forms.gle/RsGUyrmB1jtsGhYQ9',
	github_issue = 'https://github.com/badsgahhl/pihole-browser-extension/issues',
	github_user_badsgahhl = 'https://github.com/badsgahhl',
	github_user_erikr729 = 'https://github.com/erikr729'
}
