import {BadgeService, ExtensionBadgeText} from "../../data/storage/BadgeService.js";
import {PiHoleApiStatus, PiHoleApiStatusEnum} from "../../data/api/models/pihole/PiHoleApiStatus.js";
import {ApiRequestService} from "../../data/api/service/ApiRequestService.js";
import {PiHoleSettingsDefaults, PiHoleSettingsStorage, StorageAccessService} from "../../data/storage/StorageAccessService.js";
import {ApiJsonErrorMessages} from "../../data/api/errors/ApiErrorMessages.js";

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
			api_request.add_param('disable', String(time));
		}

	}
	else if (slider_box.checked)
	{

		api_request.add_param('enable');

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

	const time = <HTMLInputElement> document.getElementById('time');

	const storage: PiHoleSettingsStorage = await StorageAccessService.get_pi_hole_settings();

	const default_disable_time: number = storage.default_disable_time ? storage.default_disable_time : PiHoleSettingsDefaults.default_disable_time;

	time.defaultValue = String(default_disable_time);

}

/**
 * Function to get the current PiHoleStatus
 */
async function getPiHoleStatus(): Promise<void>
{
	const api_request: ApiRequestService = new ApiRequestService();

	const onreadystatechange = function() {
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

	api_request.add_param('status');
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



