//Function that saves the key to utils

import {PiHoleStorage} from "../utils/StorageAccess.js";

function setStorage() {
	chrome.storage.local.set({
										 pi_uri_base: (<HTMLInputElement>document.getElementById("pi_uri_base")).value,
										 api_key: (<HTMLInputElement>document.getElementById("api_key")).value,
									 }, function() {
		document.getElementById("confirmation_status").innerHTML = "Saved Successful!";
	});
}

//Function that get the API key from the utils
function getStorage() {
	chrome.storage.local.get(null, function(data) {
		(<HTMLInputElement>document.getElementById(PiHoleStorage.URI)).defaultValue = data.pi_uri_base ? data.pi_uri_base : '';
		(<HTMLInputElement>document.getElementById(PiHoleStorage.API_KEY)).defaultValue = data.api_key ? data.api_key : '';
	});
}

document.getElementById("save_button").addEventListener("click", setStorage);   //Action event for when save is pressed
window.addEventListener("load", getStorage);    //Get the API key when the page loads
