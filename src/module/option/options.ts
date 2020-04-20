/**
 * Functions for the options menu
 */

import {PiHoleStorageAccess, read_pi_hole_storage} from "../../data/storage/StorageAccess.js";

function setStorage() {
	const storage:PiHoleStorageAccess = {
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
	const storage:PiHoleStorageAccess = await read_pi_hole_storage();
	(<HTMLInputElement>document.getElementById('pi_uri_base')).defaultValue = storage.pi_uri_base ? storage.pi_uri_base : '';
	(<HTMLInputElement>document.getElementById('api_key')).defaultValue = storage.api_key ? storage.api_key : '';
}

document.getElementById('save_button').addEventListener('click', setStorage);   //Action event for when save is pressed
window.addEventListener('load', getStorage);    //Get the API key when the page loads
