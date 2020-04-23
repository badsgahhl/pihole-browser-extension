import {PiHoleSettingsStorage, StorageAccessService} from "../../data/storage/StorageAccessService.js";

/**
 * Saves the extension settings to the local storage.
 */
function set_settings(): void
{
	const storage: PiHoleSettingsStorage = {
		pi_uri_base: (<HTMLInputElement> document.getElementById('pi_uri_base')).value,
		api_key: (<HTMLInputElement> document.getElementById('api_key')).value
	};

	const save_button: HTMLButtonElement = <HTMLInputElement> document.getElementById('save_button');
	const function_callback: () => void = function() {
		const btn_default: string = save_button.value;
		save_button.value = 'Saved Successful!';
		setTimeout(function() {
			save_button.value = btn_default;
		}, 1500);
	}

	StorageAccessService.save_to_local_storage(storage, function_callback);
}

//Function fills the storage data into the option input form.
async function get_settings(): Promise<void>
{
	const storage: PiHoleSettingsStorage = await StorageAccessService.get_pi_hole_settings();
	(<HTMLInputElement> document.getElementById('pi_uri_base')).defaultValue = storage.pi_uri_base ? storage.pi_uri_base : '';
	(<HTMLInputElement> document.getElementById('api_key')).defaultValue = storage.api_key ? storage.api_key : '';
}

document.getElementById('save_button').addEventListener('click', set_settings);   //Action event for when save is pressed
window.addEventListener('load', get_settings);    //Get the API key when the page loads
