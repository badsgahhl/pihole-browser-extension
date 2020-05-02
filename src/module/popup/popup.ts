import {BadgeService, ExtensionBadgeText} from "../../data/storage/BadgeService.js";
import {PiHoleApiStatus, PiHoleApiStatusEnum} from "../../data/api/models/pihole/PiHoleApiStatus.js";
import {ApiRequestMethodEnum, ApiRequestService} from "../../data/api/service/ApiRequestService.js";
import {PiHoleSettingsDefaults, PiHoleSettingsStorage, StorageAccessService} from "../../data/storage/StorageAccessService.js";

/**
 * Function to handler the slider click.
 */
async function sliderClicked(): Promise<void>
{
	const api_request: ApiRequestService = new ApiRequestService();

	const onreadystatechange = function() {
		if (this.readyState === 4 && this.status === 200)
		{
			// Action to be performed when the document is read;
			const data: PiHoleApiStatus = JSON.parse(this.response);   //parse the return JSON
			changeIcon(data);
		}
	};

	api_request.set_method(ApiRequestMethodEnum.GET);
	api_request.set_onreadystatechange(onreadystatechange);

	const slider_box = <HTMLInputElement> document.getElementById('sliderBox');
	if (!slider_box.checked)
	{
		let time: number = Number((<HTMLInputElement> document.getElementById('time')).value);   //get the time from the box

		api_request.add_param('disable', String(time));

	}
	else if (slider_box.checked)
	{

		api_request.add_param('enable');

	}
	await api_request.send();
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
			const data = JSON.parse(this.response);   //parse the return JSON
			changeIcon(data);
		}
	};

	api_request.set_method(ApiRequestMethodEnum.GET);
	api_request.add_param('status');
	api_request.set_onreadystatechange(onreadystatechange);

	await api_request.send();
}

/**
 * This function changes different view components accordingly to the PiHoleStatus
 * @param data
 */
function changeIcon(data: PiHoleApiStatus): void
{

	const display_status = document.getElementById('display_status');
	const sliderBox = <HTMLInputElement> document.getElementById('sliderBox');
	const time = <HTMLInputElement> document.getElementById('time');

	if (data.status === PiHoleApiStatusEnum.disabled)
	{  //If the Pi-Hole status is disabled
		display_status.innerHTML = "Disabled";   //Set the popup text
		display_status.className = "disabled";   //changed the text color
		sliderBox.checked = false;
		time.disabled = true;    //disable the time input box
		BadgeService.set_badge_text(ExtensionBadgeText.disabled);  //set the badge to off
	}
	else if (data.status === PiHoleApiStatusEnum.enabled)
	{    //If the Pi-Hole is enabled
		display_status.innerHTML = "Enabled";    //Set the popup text
		display_status.className = "enabled";    //set the text color
		sliderBox.disabled = false;   //turn on the input box
		sliderBox.checked = true;
		BadgeService.set_badge_text(ExtensionBadgeText.enabled);   //set badge text to on
	}
	else
	{   //If there is an API key error
		display_status.innerHTML = "API Error";    //Set the popup text
		display_status.className = "disabled";    //set the text color
		sliderBox.disabled = true;   //turn off the input box
		BadgeService.set_badge_text(ExtensionBadgeText.error);   //set badge text to empty
	}
}

/**
 * EventListener Section
 */
document.addEventListener('DOMContentLoaded', load_settings_and_status); //When the page loads get the status
document.getElementById('sliderBox').addEventListener('click', sliderClicked);


