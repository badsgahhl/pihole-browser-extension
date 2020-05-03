import {PiHoleSettingsDefaults, PiHoleSettingsStorage, StorageAccessService} from "../../data/storage/StorageAccessService.js";

/**
 * Saves the extension settings to the local storage.
 */
function set_settings(): void
{
	const default_disable_time_input: HTMLInputElement = (<HTMLInputElement> document.getElementById('default_time'));

	const storage: PiHoleSettingsStorage = {
		pi_uri_base: (<HTMLInputElement> document.getElementById('pi_uri_base')).value,
		api_key: (<HTMLInputElement> document.getElementById('api_key')).value,
		default_disable_time: default_disable_time_input.valueAsNumber
	};

	if (!check_validity_and_error(default_disable_time_input))
	{
		return
	}

	const save_button: HTMLButtonElement = <HTMLButtonElement> document.getElementById('save_button');
	const function_callback: () => void = function() {
		const btn_default: string = save_button.textContent;
		save_button.textContent = 'Saved Successful!';
		setTimeout(function() {
			save_button.textContent = btn_default;
		}, 1500);
	}

	StorageAccessService.save_to_local_storage(storage, function_callback);
}

/**
 * Checks if the input is valid and shows an error if not.
 * @param element
 */
function check_validity_and_error(element: HTMLInputElement): boolean
{
	if (!element.checkValidity())
	{
		console.warn('Input Value is not valid.')
		element.setAttribute('style', 'background:red;')

		setTimeout(function() {
			element.removeAttribute('style');
		}, 1500);

		return false;
	}
	return true;
}

//Function fills the storage data into the option input form.
async function get_settings(): Promise<void>
{
	const storage: PiHoleSettingsStorage = await StorageAccessService.get_pi_hole_settings();
	(<HTMLInputElement> document.getElementById('pi_uri_base')).defaultValue = storage.pi_uri_base ? storage.pi_uri_base : PiHoleSettingsDefaults.pi_uri_base;
	(<HTMLInputElement> document.getElementById('api_key')).defaultValue = storage.api_key ? storage.api_key : PiHoleSettingsDefaults.api_key;

	const default_time: number = storage.default_disable_time ? storage.default_disable_time : PiHoleSettingsDefaults.default_disable_time;
	(<HTMLInputElement> document.getElementById('default_time')).defaultValue = String(default_time);
}

document.getElementById('save_button').addEventListener('click', set_settings);   //Action event for when save is pressed
window.addEventListener('load', get_settings);    //Get the API key when the page loads
