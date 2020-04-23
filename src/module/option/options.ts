/**
 * Functions for the options menu
 */

import {PiHoleSettingsStorage, StorageAccess} from "../../data/storage/StorageAccess.js";

function setStorage() {
	const storage:PiHoleSettingsStorage = {
		pi_uri_base: (<HTMLInputElement>document.getElementById('pi_uri_base')).value,
		api_key: (<HTMLInputElement>document.getElementById('api_key')).value
	};

	const save_button:HTMLButtonElement = <HTMLInputElement>document.getElementById('save_button');
	chrome.storage.local.set(storage, function() {
		const btn_default:string = save_button.value;
		save_button.value = 'Saved Successful!';
		setTimeout(function() {
			save_button.value = btn_default;
		}, 1500);
	});
}

//Function fills the storage data into the option input form.
async function getStorage() {
	const storage:PiHoleSettingsStorage = await StorageAccess.get_pi_hole_settings();
	(<HTMLInputElement>document.getElementById('pi_uri_base')).defaultValue = storage.pi_uri_base ? storage.pi_uri_base : '';
	(<HTMLInputElement>document.getElementById('api_key')).defaultValue = storage.api_key ? storage.api_key : '';
}

document.getElementById('save_button').addEventListener('click', setStorage);   //Action event for when save is pressed
window.addEventListener('load', getStorage);    //Get the API key when the page loads
