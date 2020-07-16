export module i18nService
{
	/**
	 * Wrapper Function for the chrome.i18n.getMessage Function
	 * @param key
	 * @param substitutions
	 */
	export function translate(key: string, substitutions?: any): string
	{
		return chrome.i18n.getMessage(key, substitutions);
	}

	/**
	 * Legacy function to translate a html page template without adding every key dynamically
	 * @use i18nService::translate
	 * @deprecated
	 */
	export function translate_html_page(): void
	{
		const objects = document.getElementsByTagName('html');
		for (let j = 0; j < objects.length; j++)
		{
			const obj = objects[j];

			const inner_html_untranslated = obj.innerHTML.toString();
			const inner_html_translated = inner_html_untranslated.replace(/__MSG_(\w+)__/g, function(match, v1) {
				return v1 ? chrome.i18n.getMessage(v1) : "";
			});

			if (inner_html_translated != inner_html_untranslated)
			{
				obj.innerHTML = inner_html_translated;
			}
		}
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
	options_url_invalid_warning = "options_url_invalid_warning"
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
