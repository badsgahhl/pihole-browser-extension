import {StorageAccessService} from '../../data/storage/StorageAccessService.js';
import {BadgeService, ExtensionBadgeText} from "../../data/storage/BadgeService.js";
import {PiHoleApiStatus, PiHoleApiStatusEnum} from "../../data/api/models/pihole/PiHoleApiStatus.js";

/**
 * Function to handler the slider click.
 * TODO: HTTPRequest into APIRequestService
 */
async function sliderClicked(): Promise<void>
{
	const httpResponse = new XMLHttpRequest();    //Make a new object to accept return from server
	const url_base = (await StorageAccessService.get_pi_hole_settings()).pi_uri_base;
	const api_key = (await StorageAccessService.get_pi_hole_settings()).api_key;

	let url: string;
	const slider_box = <HTMLInputElement> document.getElementById('sliderBox');
	if (!slider_box.checked)
	{
		let time: number = Number((<HTMLInputElement> document.getElementById('time')).value);   //get the time from the box

		url = url_base + "/api.php?disable=" + String(time) + "&auth=" + api_key;  //build the url
	}
	else if (slider_box.checked)
	{
		url = url_base + "/api.php?enable&auth=" + api_key;    //build the url
	}

	httpResponse.onreadystatechange = function() {
		if (this.readyState === 4 && this.status === 200)
		{
			// Action to be performed when the document is read;
			const data: PiHoleApiStatus = JSON.parse(this.response);   //parse the return JSON
			changeIcon(data);
		}
	};
	httpResponse.open('GET', url, true);
	httpResponse.send();
}

/**
 * Function to get the current PiHoleStatus
 * TODO: Should be built into an APIAccess Service
 */
async function getPiHoleStatus(): Promise<void>
{
	const httpResponse = new XMLHttpRequest();    //make a new request object

	httpResponse.onreadystatechange = function() {
		if (this.readyState === 4 && this.status === 200)
		{
			// Action to be performed when the document is read;
			const data = JSON.parse(this.response);   //parse the return JSON
			changeIcon(data);
		}
	};
	const uri = (await StorageAccessService.get_pi_hole_settings()).pi_uri_base;

	httpResponse.open("GET", uri + "/api.php?", true);
	httpResponse.send();
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
document.addEventListener('DOMContentLoaded', getPiHoleStatus); //When the page loads get the status
document.getElementById('sliderBox').addEventListener('click', sliderClicked);


