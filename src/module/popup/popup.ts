import {BadgeService, ExtensionBadgeText} from "../../service/browser/BadgeService";
import {PiHoleApiStatus, PiHoleApiStatusEnum} from "../../service/api/models/pihole/PiHoleApiStatus";
import {PiHoleSettingsDefaults, StorageService} from "../../service/browser/StorageService";
import {TabService} from "../../service/browser/TabService";
import {ApiListMode} from "../../service/api/models/pihole/PiHoleListStatus";
import "./popup.css";
import "../general/darkmode.css";
import "bootstrap/dist/css/bootstrap.min.css"
import {PiHoleApiService} from "../../service/api/service/PiHoleApiService";
import {i18nService} from "../../service/browser/i18nService";

let current_tab_url: string = '';

/**
 * Function to handler the slider click.
 */
async function on_slider_click(): Promise<void>
{
	const status_mode = (<HTMLInputElement> document.getElementById('sliderBox')).checked ? PiHoleApiStatusEnum.enabled : PiHoleApiStatusEnum.disabled;
	let time: number = Number((<HTMLInputElement> document.getElementById('time')).value);

	if (time >= 0)
	{
		await PiHoleApiService.change_pi_hole_status(status_mode, time, (data) => on_slider_click_success_handler(data), (data) => throw_console_badge_error(data));

	}
	else
	{
		throw_console_badge_error('Time cannot be smaller than 0. Canceling api request.', true);
	}
}

/**
 * Success Handler for the slider. Is fired as soon as the change_pi_hole_status is done.
 * @param data
 */
async function on_slider_click_success_handler(data: PiHoleApiStatus): Promise<void>
{
	change_icon(data);
	if (data.status === PiHoleApiStatusEnum.disabled)
	{
		const reload_after_disable = (await StorageService.get_reload_after_disable());

		if (reload_after_disable)
		{
			TabService.reload_current_tab(1000);
		}
	}
}

/**
 * Returns an error message to the console and changes the icon to error.
 * @param error_message
 * @param refresh_status
 */
function throw_console_badge_error(error_message: string, refresh_status: boolean = false): void
{
	console.warn(error_message);

	change_icon({status: PiHoleApiStatusEnum.error})
	if (refresh_status)
	{
		setTimeout(function() {
			PiHoleApiService.refresh_pi_hole_status((data => change_icon(data))).then();
		}, 1500);
	}
}

async function load_settings_and_status(): Promise<void>
{
	i18nService.translate_html_page();

	render_slider_switch().then();

	PiHoleApiService.refresh_pi_hole_status((data => change_icon(data))).then();

	check_for_pi_hole_updates().then();

	set_default_disable_time_html().then();

	document.getElementById('time').addEventListener('input', time_input_changed);
}

/**
 * Renders the the slider depending on the current badge text.
 * Gets updated if there is a change between the background and the popup refresh
 */
async function render_slider_switch(): Promise<void>
{
	const pi_hole_enabled_from_badge = (await BadgeService.get_badge_text() === ExtensionBadgeText.enabled);
	const input = document.createElement('input');
	input.addEventListener('click', on_slider_click);
	input.checked = pi_hole_enabled_from_badge;
	input.id = 'sliderBox';
	input.type = 'checkbox';

	const span = document.createElement('span');
	span.classList.add('slider', 'justify-content-center');

	const label = document.createElement('label');
	label.id = 'switch';

	label.appendChild(input)
	label.appendChild(span)

	document.getElementById('status_footer').appendChild(label);

	// We also enable the time input with the background badge text
	(<HTMLInputElement> document.getElementById('time')).disabled = !pi_hole_enabled_from_badge;
}

/**
 * Sets the default disable time from the storage to the FE Formula
 */
async function set_default_disable_time_html(): Promise<void>
{
	const time = <HTMLInputElement> document.getElementById('time');

	const default_disable_time_storage = await StorageService.get_default_disable_time();

	const default_disable_time: number = default_disable_time_storage ? default_disable_time_storage : PiHoleSettingsDefaults.default_disable_time;

	time.defaultValue = String(default_disable_time);
}

/**
 * Checks if the pihole is up to date
 */
async function check_for_pi_hole_updates(): Promise<void>
{
	const versions_array = (await PiHoleApiService.get_pi_hole_version());

	let update_available = false;
	let amount_updatable = 0;
	for (const pi_hole_version of versions_array)
	{
		if (pi_hole_version.FTL_current < pi_hole_version.FTL_latest || pi_hole_version.core_current < pi_hole_version.core_latest || pi_hole_version.web_current < pi_hole_version.web_latest)
		{
			update_available = true;
			amount_updatable++;
		}
	}

	if (update_available)
	{
		const main_elem = document.getElementById('main');

		const alert = document.createElement('div');
		alert.classList.add('alert', 'alert-warning', 'popup-alert');
		alert.setAttribute('role', 'alert');
		alert.innerText = "PiHole Update available! (" + amount_updatable + "/" + versions_array.length + ")";

		main_elem.append(alert);
	}

}

/**
 * Singleton like. We cache the domain for each instance of the popup
 * to prevent wrong domains if the users switches the tab an didn't close the popup, or
 * other weired scenarios.
 */
async function get_current_tab_url_cleaned_cached(): Promise<string>
{
	if (current_tab_url.length <= 0)
	{
		current_tab_url = (await TabService.get_current_tab_url_cleaned());
	}
	return current_tab_url;
}

/**
 * Shows or hides the list feature card depending on the pihole version, url, and status
 */
async function toggle_list_card(): Promise<void>
{
	const card_object = document.getElementById('list_card');

	const url = (await get_current_tab_url_cleaned_cached());

	if (!url)
	{
		return;
	}

	document.getElementById('current_url').innerText = url;

	const pi_hole_versions = (await PiHoleApiService.get_pi_hole_version());
	// TODO: Needs a higher version later with the fix
	let pi_hole_version_5 = true;

	for (let version of pi_hole_versions)
	{
		if (version.FTL_current < 5 && version.FTL_current !== -1)
		{
			pi_hole_version_5 = false;
		}
	}

	if (pi_hole_version_5 && card_object.classList.contains('d-none'))
	{
		card_object.classList.remove('d-none');

		// Adding the event handlers
		const list_action_white = <HTMLButtonElement> document.getElementById('list_action_white');
		const list_action_black = <HTMLButtonElement> document.getElementById('list_action_black');
		list_action_white.addEventListener('click', () => list_domain(ApiListMode.whitelist, list_action_white));
		list_action_black.addEventListener('click', () => list_domain(ApiListMode.blacklist, list_action_black));
	}
}

/**
 * Function to override the webrequest header.
 * This is needed to go around the pihole cors security policies.
 * @param details
 */
function get_web_request_origin_modifier_callback(details)
{
	for (let i = 0; i < details.requestHeaders.length; ++i)
	{
		if (details.requestHeaders[i].name === 'Origin')
		{
			details.requestHeaders[i].value = '';
		}
	}

	return {
		requestHeaders: details.requestHeaders
	}
}

/**
 * This function will add a domain to the whitelist or block list
 * @param mode
 * @param buttonElement
 */
async function list_domain(mode: ApiListMode, buttonElement: HTMLButtonElement): Promise<void>
{
	let pi_hole_urls = (await StorageService.get_pi_hole_settings_array());
	let pi_hole_urls_array = [];
	if (typeof pi_hole_urls !== "undefined")
	{
		for (const pi_hole_url of pi_hole_urls)
		{
			pi_hole_urls_array.push(pi_hole_url.pi_uri_base + "/*");
		}
	}
	else
	{
		return;
	}

	const domain = (await get_current_tab_url_cleaned_cached());

	if (!pi_hole_urls_array || !domain)
	{
		return;
	}

	// Registering the handler only after the button click. We dont want to change the headers of anything else
	// This is only needed in chrome! -.-
	if (typeof browser === 'undefined')
	{
		chrome.webRequest.onBeforeSendHeaders.addListener(
			get_web_request_origin_modifier_callback, {
				urls: pi_hole_urls_array
			},
			[
				"blocking",
				"requestHeaders",
				"extraHeaders"
			]);
	}

	toggle_list_button(buttonElement);

	// Delay between each call to one of multiple piholes
	const delay_increment = 2000;
	let delay = 0;

	const pi_hole_list_results = (await PiHoleApiService.list_domain(domain, mode));

	if (typeof browser === 'undefined')
	{
		chrome.webRequest.onBeforeSendHeaders.removeListener(get_web_request_origin_modifier_callback);
	}

	pi_hole_list_results.forEach((pi_hole_result, index) => {
		setTimeout(function() {
			const current_url_element = document.getElementById('current_url');
			if (pi_hole_result.includes('skipped'))
			{
				current_url_element.classList.add('bg-warning')
				setTimeout(() => {
					current_url_element.classList.remove('bg-warning');
				}, 1500)
			}
			else if (pi_hole_result.includes('added'))
			{
				current_url_element.classList.add('bg-success')
				setTimeout(function() {
					current_url_element.classList.remove('bg-success');
				}, 1500);
			}

			// After the last one we enable the button again and remove the spinning circle
			if (index + 1 === pi_hole_list_results.length)
			{
				setTimeout(async () => {
					const reload_after_white_black_list = (await StorageService.get_reload_after_white_list());

					if (reload_after_white_black_list && mode === ApiListMode.whitelist)
					{
						TabService.reload_current_tab(250);
					}
					toggle_list_button(buttonElement);
				}, 1500);
			}
		}, delay);
		delay += delay_increment;
	})
}

/**
 * Toggles to list buttons between showing loading icon and the normal svg.
 * Will also block both buttons until api request is completed.
 */
function toggle_list_button(clicked_button: HTMLElement): void
{
	const list_buttons = document.querySelectorAll('.btn-list');
	list_buttons.forEach((object: HTMLButtonElement) => {
		const is_pressed_button = object.isEqualNode(clicked_button);
		if (object.disabled)
		{
			if (is_pressed_button)
			{
				object.querySelectorAll('.spinner-border').forEach((child_object) => {
					child_object.classList.add('d-none');
				});
				object.querySelectorAll('svg').forEach((child_object) => {
					child_object.classList.remove('d-none');
				});
			}
			object.disabled = false;
		}
		else
		{
			if (is_pressed_button)
			{
				object.querySelectorAll('.spinner-border').forEach((child_object) => {
					child_object.classList.remove('d-none');
				});
				object.querySelectorAll('svg').forEach((child_object) => {
					child_object.classList.add('d-none');
				});
			}

			object.disabled = true;
		}
	});
}


/**
 * This function changes different view components accordingly to the PiHoleStatus
 * @param data
 */
function change_icon(data: PiHoleApiStatus): void
{
	const sliderBox = <HTMLInputElement> document.getElementById('sliderBox');
	const time = <HTMLInputElement> document.getElementById('time');

	if (data.status === PiHoleApiStatusEnum.disabled)
	{  //If the Pi-Hole status is disabled
		sliderBox.checked = false;
		time.disabled = true;    //disable the time input box
		BadgeService.set_badge_text(ExtensionBadgeText.disabled);  //set the badge to off
	}
	else if (data.status === PiHoleApiStatusEnum.enabled)
	{    //If the Pi-Hole is enabled
		time.disabled = false;
		sliderBox.disabled = false;   //turn on the input box
		sliderBox.checked = true;
		BadgeService.set_badge_text(ExtensionBadgeText.enabled);   //set badge text to on
		toggle_list_card().then();
	}
	else
	{   //If there is an API key error
		time.disabled = true;
		sliderBox.disabled = true;   //turn off the input box
		sliderBox.checked = false;
		BadgeService.set_badge_text(ExtensionBadgeText.error);   //set badge text to empty
	}
}

function time_input_changed(): void
{
	const input_object = <HTMLInputElement> document.getElementById('time');
	const unit_object = document.getElementById('time_unit');
	const infinity_symbol = '∞'

	if (input_object.valueAsNumber === 0)
	{
		unit_object.innerText = infinity_symbol;
	}
	else if (unit_object.innerText == infinity_symbol)
	{
		unit_object.innerText = 's';
	}
}

/**
 * [Beta] Initialises the new Vue Popup
 */
async function init_vue(): Promise<void>
{
	const vue_import = await import ('vue');
	const popup_component_import = await import ('./vue/PopupComponent.vue');
	const bootstrap_vue_import = await import ('bootstrap-vue');

	const Vue = vue_import.default;
	const BootstrapVue = bootstrap_vue_import.default;
	const PopupComponent = popup_component_import.default;


	const popup_vue_component = {
		el: "#main",
		render: h => h(PopupComponent)
	};

	Vue.use(BootstrapVue);
	new Vue(popup_vue_component);
}

/**
 * Main Init function for the popup
 */
async function init(): Promise<void>
{
	const beta_flag = await StorageService.get_beta_feature_flag();

	if (beta_flag)
	{
		await init_vue();
	}
	else
	{
		document.getElementById('main').hidden = false;
		await load_settings_and_status();
	}
}

/**
 * EventListener Section
 */
document.addEventListener('DOMContentLoaded', () => init()); //When the page loads get the status
