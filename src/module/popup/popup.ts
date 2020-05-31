import {BadgeService, ExtensionBadgeText} from "../../data/storage/BadgeService";
import {PiHoleApiStatus, PiHoleApiStatusEnum} from "../../data/api/models/pihole/PiHoleApiStatus";
import {ApiRequestMethodEnum, PiHoleApiRequest} from "../../data/api/service/PiHoleApiRequest";
import {
	PiHoleSettingsDefaults,
	PiHoleSettingsStorageOld,
	StorageService
} from "../../data/storage/StorageService";
import {ApiJsonErrorMessages} from "../../data/api/errors/ApiErrorMessages";
import {TabService} from "../../data/storage/TabService";
import {ApiListMode} from "../../data/api/models/pihole/PiHoleListStatus";
import "./popup.css";
import "../general/darkmode.css";
import "bootstrap/dist/css/bootstrap.min.css"
import {PiHoleVersions} from "../../data/api/models/pihole/PiHoleVersions";
import {PiHoleApiService} from "../../data/api/service/PiHoleApiService";

let current_tab_url:string = '';

/**
 * Function to handler the slider click.
 */
async function on_slider_click():Promise<void> {
	const api_request:PiHoleApiRequest = new PiHoleApiRequest();

	api_request.onreadystatechange = function() {
		if (this.readyState === 4 && this.status === 200) {
			// Action to be performed when the document is read;
			let data:PiHoleApiStatus;
			try {
				data = JSON.parse(this.response);   //parse the return JSON
			}
			catch (e) {
				throw_console_badge_error(ApiJsonErrorMessages.invalid);
				return;
			}
			change_icon(data);
		} else if (this.status !== 200 && this.status !== 0) {
			console.error(this.status);
			throw_console_badge_error('API Call failed. Check the address.');
		}
	};

	const slider_box = <HTMLInputElement>document.getElementById('sliderBox');
	if (!slider_box.checked) {
		let time:number = Number((<HTMLInputElement>document.getElementById('time')).value);   //get the time from the box

		if (time < 0) {
			throw_console_badge_error('Time cannot be smaller than 0. Canceling api request.', true);
			return;
		} else {
			api_request.add_get_param('disable', String(time));
		}

	} else if (slider_box.checked)
	{

		api_request.add_get_param('enable');

	}
	await api_request.send();
}

/**
 * Returns an error message to the console and changes the icon to error.
 * @param error_message
 * @param refresh_status
 */
function throw_console_badge_error(error_message:string, refresh_status:boolean = false):void {
	console.warn(error_message);

	change_icon({status: PiHoleApiStatusEnum.error})
	if (refresh_status) {
		setTimeout(function() {
			refresh_pi_hole_status().then();
		}, 1500);
	}
}

async function load_settings_and_status():Promise<void> {
	refresh_pi_hole_status().then();

	check_for_pi_hole_updates().then();

	set_default_disable_time_html().then();

	document.getElementById('sliderBox').addEventListener('click', on_slider_click);
	document.getElementById('time').addEventListener('input', time_input_changed);
}

/**
 * Sets the default disable time from the storage to the FE Formula
 */
async function set_default_disable_time_html():Promise<void> {
	const time = <HTMLInputElement>document.getElementById('time');

	const storage:PiHoleSettingsStorageOld = await StorageService.get_pi_hole_settings();

	const default_disable_time:number = storage.default_disable_time ? storage.default_disable_time : PiHoleSettingsDefaults.default_disable_time;

	time.defaultValue = String(default_disable_time);
}

/**
 * Checks if the pihole is up to date
 */
async function check_for_pi_hole_updates():Promise<void> {
	const versions = (await PiHoleApiService.get_pi_hole_version());

	if (versions.FTL_current < versions.FTL_latest || versions.core_current < versions.core_current || versions.web_current < versions.web_latest) {
		const main_elem = document.getElementById('main');

		const alert = document.createElement('div');
		alert.classList.add('alert', 'alert-warning', 'popup-alert');
		alert.setAttribute('role', 'alert');
		alert.innerText = "PiHole Update available!"

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
async function toggle_list_card():Promise<void> {
	const card_object = document.getElementById('list_card');

	const url = (await get_current_tab_url_cleaned_cached());

	if (!url) {
		return;
	}

	document.getElementById('current_url').innerText = url;

	const pi_hole_versions:PiHoleVersions = (await PiHoleApiService.get_pi_hole_version());
	// TODO: Needs a higher version later with the fix
	if (pi_hole_versions.FTL_current >= 5) {
		card_object.classList.remove('d-none');

		// Adding the event handlers
		const list_action_white = <HTMLButtonElement>document.getElementById('list_action_white');
		const list_action_black = <HTMLButtonElement>document.getElementById('list_action_black');
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
async function list_domain(mode:ApiListMode, buttonElement:HTMLButtonElement):Promise<void> {
	const pi_url = (await StorageService.get_pi_hole_settings()).pi_uri_base;
	const domain = (await get_current_tab_url_cleaned_cached());

	if (!pi_url || !domain) {
		return;
	}

	// Registering the handler only after the button click. We dont want to change the headers of anything else
	// This is only needed in chrome! -.-
	if (typeof browser === 'undefined') {
		chrome.webRequest.onBeforeSendHeaders.addListener(
			get_web_request_origin_modifier_callback, {
				urls: [pi_url + "/*"]
			},
			[
				"blocking",
				"requestHeaders",
				"extraHeaders"
			]);
	}

	toggle_list_button(buttonElement);

	const api_request = new PiHoleApiRequest();

	api_request.method = ApiRequestMethodEnum.POST;
	api_request.add_get_param('list', mode);
	api_request.add_get_param('add', domain);
	api_request.add_post_param('comment', 'Added via PiHole Remote Extension');

	api_request.onreadystatechange = function() {
		if (this.readyState === 4 && this.status === 200)
		{
			if (typeof browser === 'undefined')
			{
				chrome.webRequest.onBeforeSendHeaders.removeListener(get_web_request_origin_modifier_callback);
			}

			const response: string = this.response;
			const current_url_element = document.getElementById('current_url');

			/**
			 * Changing the background color depending on the status of adding the url.
			 * Orange: Url was skipped by PIHOLE
			 * Green: URL was added to the list.
			 */
			if (response.includes('skipped'))
			{
				setTimeout(() => {
					toggle_list_button(buttonElement);
					current_url_element.classList.add('bg-warning')
					setTimeout(() => {
						current_url_element.classList.remove('bg-warning');
					}, 1500)
				}, 500);
			}
			else if (response.includes('added'))
			{
				// We wait 3.5 Seconds until we can assume that the pihole is back online.
				current_url_element.classList.add('bg-success')
				setTimeout(function() {
					current_url_element.classList.remove('bg-success');
				}, 1500)
				setTimeout(() => {
					toggle_list_button(buttonElement);
				}, 3500);
			}
		}
	}
	api_request.send().then();
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
				object.querySelectorAll('.spinner-border').forEach((object) => {
					object.classList.add('d-none');
				});
				object.querySelectorAll('svg').forEach((object) => {
					object.classList.remove('d-none');
				});
			}
			object.disabled = false;
		}
		else
		{
			if (is_pressed_button)
			{
				object.querySelectorAll('.spinner-border').forEach((object) => {
					object.classList.remove('d-none');
				});
				object.querySelectorAll('svg').forEach((object) => {
					object.classList.add('d-none');
				});
			}

			object.disabled = true;
		}
	});
}

/**
 * Function to get the current PiHoleStatus
 */
async function refresh_pi_hole_status():Promise<void> {
	const api_request:PiHoleApiRequest = new PiHoleApiRequest();

	const onreadystatechange = function() {
		if (this.readyState === 4 && this.status === 200) {
			// Action to be performed when the document is read;
			let data;
			try {
				data = JSON.parse(this.response);
			}
			catch (e) {
				console.warn(ApiJsonErrorMessages.invalid);
				return;
			}
			change_icon(data);
		}
	};

	api_request.add_get_param('status');
	api_request.onreadystatechange = onreadystatechange;

	await api_request.send();
}

/**
 * This function changes different view components accordingly to the PiHoleStatus
 * @param data
 */
function change_icon(data:PiHoleApiStatus):void {
	const sliderBox = <HTMLInputElement>document.getElementById('sliderBox');
	const time = <HTMLInputElement>document.getElementById('time');

	if (data.status === PiHoleApiStatusEnum.disabled) {  //If the Pi-Hole status is disabled
		sliderBox.checked = false;
		time.disabled = true;    //disable the time input box
		BadgeService.set_badge_text(ExtensionBadgeText.disabled);  //set the badge to off
	} else if (data.status === PiHoleApiStatusEnum.enabled) {    //If the Pi-Hole is enabled
		time.disabled = false;
		sliderBox.disabled = false;   //turn on the input box
		sliderBox.checked = true;
		BadgeService.set_badge_text(ExtensionBadgeText.enabled);   //set badge text to on
		toggle_list_card().then();
	} else {   //If there is an API key error
		time.disabled = true;
		sliderBox.disabled = true;   //turn off the input box
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
 * EventListener Section
 */
document.addEventListener('DOMContentLoaded', load_settings_and_status); //When the page loads get the status




