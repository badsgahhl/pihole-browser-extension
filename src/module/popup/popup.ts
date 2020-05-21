import {BadgeService, ExtensionBadgeText} from "../../data/storage/BadgeService.js";
import {PiHoleApiStatus, PiHoleApiStatusEnum} from "../../data/api/models/pihole/PiHoleApiStatus.js";
import {ApiRequestMethodEnum, ApiRequestService} from "../../data/api/service/ApiRequestService.js";
import {PiHoleSettingsDefaults, PiHoleSettingsStorage, StorageAccessService} from "../../data/storage/StorageAccessService.js";
import {ApiJsonErrorMessages} from "../../data/api/errors/ApiErrorMessages.js";
import {TabService} from "../../data/storage/TabService.js";
import {ApiListMode} from "../../data/api/models/pihole/PiHoleListStatus.js";


chrome.webRequest.onBeforeSendHeaders.addListener(
	function(details) {
		for (let i = 0; i < details.requestHeaders.length; ++i)
		{
			if (details.requestHeaders[i].name === 'Origin')
			{
				details.requestHeaders[i].value = '';
			}
		}

		return {
			requestHeaders: details.requestHeaders
		};
	}, {
		urls: ["<all_urls>"]
	},
	[
		"blocking",
		"requestHeaders",
		"extraHeaders"
	]);

/**
 * Function to handler the slider click.
 */
async function sliderClicked(): Promise<void>
{
	const api_request: ApiRequestService = new ApiRequestService();

	api_request.onreadystatechange = function() {
		if (this.readyState === 4 && this.status === 200)
		{
			// Action to be performed when the document is read;
			let data: PiHoleApiStatus;
			try
			{
				data = JSON.parse(this.response);   //parse the return JSON
			}
			catch (e)
			{
				show_error_message(ApiJsonErrorMessages.invalid);
				return;
			}
			changeIcon(data);
		}
		else if (this.status !== 200 && this.status !== 0)
		{
			console.error(this.status);
			show_error_message('API Call failed. Check the address.');
		}
	};

	const slider_box = <HTMLInputElement> document.getElementById('sliderBox');
	if (!slider_box.checked)
	{
		let time: number = Number((<HTMLInputElement> document.getElementById('time')).value);   //get the time from the box

		if (time < 0)
		{
			show_error_message('Time cannot be smaller than 0. Canceling api request.', true);
			return;
		}
		else
		{
			api_request.add_get_param('disable', String(time));
		}

	}
	else if (slider_box.checked)
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
function show_error_message(error_message: string, refresh_status: boolean = false): void
{
	console.warn(error_message);

	changeIcon({status: PiHoleApiStatusEnum.error})
	if (refresh_status)
	{
		setTimeout(function() {
			getPiHoleStatus().then();
		}, 1500);
	}
}

async function load_settings_and_status(): Promise<void>
{
	getPiHoleStatus().then();

	whitelist_blacklist_handler().then();

	const time = <HTMLInputElement> document.getElementById('time');

	const storage: PiHoleSettingsStorage = await StorageAccessService.get_pi_hole_settings();

	const default_disable_time: number = storage.default_disable_time ? storage.default_disable_time : PiHoleSettingsDefaults.default_disable_time;

	time.defaultValue = String(default_disable_time);

}

/**
 * Adds the event handlers for the list buttons
 */
async function whitelist_blacklist_handler()
{
	const url = (await TabService.get_current_tab_url_cleaned());

	if (!url)
	{
		return;
	}

	document.getElementById('list_card').classList.remove('d-none');

	document.getElementById('current_url').innerText = url;


	/**
	 * EventListener for the Buttons
	 */
	document.getElementById('list_action_white').addEventListener('click', (event) => list_domain(url, ApiListMode.whitelist, event));
	document.getElementById('list_action_black').addEventListener('click', (event) => list_domain(url, ApiListMode.blacklist, event));

}

/**
 * This function will add a domain to the whitelist or blocklist
 * @param domain
 * @param mode
 * @param event
 */
function list_domain(domain: string, mode: ApiListMode, event: MouseEvent): void
{
	const button_element = <HTMLButtonElement> event.currentTarget;
	toggle_list_button(button_element);

	const api_request = new ApiRequestService();

	api_request.method = ApiRequestMethodEnum.POST;
	api_request.add_get_param('list', mode);
	api_request.add_get_param('add', domain);
	api_request.add_post_param('comment', 'Added via PiHole Remote Extension');

	api_request.onreadystatechange = function() {
		console.error(this.response);
		if (this.readyState === 4 && this.status === 200)
		{
			// We wait 12 Seconds until we can assume that the pihole is back online.
			setTimeout(() => toggle_list_button(button_element), 12000)
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
async function getPiHoleStatus(): Promise<void>
{
	const api_request: ApiRequestService = new ApiRequestService();

	const onreadystatechange = function() {
		console.log(this.response)
		if (this.readyState === 4 && this.status === 200)
		{
			// Action to be performed when the document is read;
			let data;
			try
			{
				data = JSON.parse(this.response);
			}
			catch (e)
			{
				console.warn(ApiJsonErrorMessages.invalid);
				return;
			}
			changeIcon(data);
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
function changeIcon(data: PiHoleApiStatus): void
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
	}
	else
	{   //If there is an API key error
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
	console.log(unit_object.innerText);

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
document.getElementById('sliderBox').addEventListener('click', sliderClicked);
document.getElementById('time').addEventListener('input', time_input_changed);




