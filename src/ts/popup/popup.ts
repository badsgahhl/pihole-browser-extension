//Function called after the enable/disable button is pressed.

import {get_storage_access, PiHoleStorage} from '../utils/StorageAccess.js';

async function buttonClicked() {
	const httpResponse = new XMLHttpRequest();    //Make a new object to accept return from server
	const PI_URI_BASE = await get_storage_access().read(PiHoleStorage.URI);
	const API_KEY = await get_storage_access().read(PiHoleStorage.API_KEY);

	let url;
	const slider_box = <HTMLInputElement>document.getElementById("sliderBox");
	if (!slider_box.checked) {
		let time:number = Number((<HTMLInputElement>document.getElementById("time")).value);   //get the time from the box

		url = PI_URI_BASE + "/api.php?disable=" + String(time) + "&auth=" + API_KEY;  //build the url
	} else if (slider_box.checked) {
		url = PI_URI_BASE + "/api.php?enable&auth=" + API_KEY;    //build the url
	}

	httpResponse.onreadystatechange = function() {
		if (this.readyState === 4 && this.status === 200) {
			// Action to be performed when the document is read;
			const data = JSON.parse(this.response);   //parse the return JSON
			changeIcon(data);
		}
	};
	httpResponse.open("GET", String(url), true);
	httpResponse.send();
}

//Function that gets the current status of the Pi-Hole
async function getPiHoleStatus() {

	const httpResponse = new XMLHttpRequest();    //make a new request object

	httpResponse.onreadystatechange = function() {
		if (this.readyState === 4 && this.status === 200) {
			// Action to be performed when the document is read;
			const data = JSON.parse(this.response);   //parse the return JSON
			changeIcon(data);
		}
	};
	const uri = await get_storage_access().read('pi_uri_base');

	httpResponse.open("GET", uri + "/api.php?", true);
	httpResponse.send();
}

function changeIcon(data) {

	const display_status = document.getElementById("display_status");
	const sliderBox = <HTMLInputElement>document.getElementById("sliderBox");
	const time = <HTMLInputElement>document.getElementById("time");

	if (data.status === "disabled") {  //If the Pi-Hole status is disabled
		display_status.innerHTML = "Disabled";   //Set the popup text
		display_status.className = "disabled";   //changed the text color
		sliderBox.checked = false;
		time.disabled = true;    //disable the time input box
		chrome.browserAction.setBadgeText({text: "Off"});  //set the badge to off
	} else if (data.status === 'enabled') {    //If the Pi-Hole is enabled
		display_status.innerHTML = "Enabled";    //Set the popup text
		display_status.className = "enabled";    //set the text color
		sliderBox.disabled = false;   //turn on the input box
		sliderBox.checked = true;
		chrome.browserAction.setBadgeText({text: "On"});   //set badge text to on
	} else {   //If there is an API key error
		display_status.innerHTML = "API Error";    //Set the popup text
		display_status.className = "disabled";    //set the text color
		sliderBox.disabled = true;   //turn off the input box
		chrome.browserAction.setBadgeText({text: ""});   //set badge text to empty
	}
}


document.addEventListener("DOMContentLoaded", getPiHoleStatus); //When the page loads get the status
document.getElementById('sliderBox').addEventListener('click', buttonClicked);


