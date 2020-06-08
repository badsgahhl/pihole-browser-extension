import {PiHoleSettingsDefaults, PiHoleSettingsStorage, StorageService} from "../../data/storage/StorageService";
import "./options.css";
import "../general/darkmode.css";
import "bootstrap/dist/css/bootstrap.min.css"

/**
 * Saves the extension settings to the local storage.
 */
function set_settings(): void
{
	const default_disable_time_input: HTMLInputElement = (<HTMLInputElement> document.getElementById('default_time'));

	// Removing spaces from the api_key and pi_uri
	const api_key = (<HTMLInputElement> document.getElementById('api_key')).value.replace(/\s+/g, '');
	const pi_uri_base = (<HTMLInputElement> document.getElementById('pi_uri_base')).value.replace(/\s+/g, '')

	// Checks the API Key. We save the key but show a warning if it doesnt match the expression.
	if (!api_key.match('^[a-f0-9]{64}$') && api_key.length !== 0)
	{
		toggle_api_warning('Api Key doesn\'t match scheme (64 chars long). It may be invalid!');
	}
	else
	{
		toggle_api_warning();
	}

	if (!check_validity_and_error(default_disable_time_input))
	{
		return;
	}

	const settings_storage: PiHoleSettingsStorage = {
		pi_uri_base: pi_uri_base,
		api_key: api_key,
	};

	const save_button: HTMLButtonElement = <HTMLButtonElement> document.getElementById('save_button');
	const function_callback: () => void = function() {
		const btn_default: string = save_button.textContent;
		save_button.disabled = true;
		save_button.textContent = 'Saved!';
		setTimeout(function() {
			save_button.textContent = btn_default;
			save_button.disabled = false;
		}, 1500);
	}

	StorageService.clear_pi_hole_settings();
	StorageService.save_default_disable_time(default_disable_time_input.valueAsNumber);
	StorageService.add_pi_hole_settings(settings_storage, function_callback);
}

/**
 * Checks if the input is valid and shows an error if not.
 * @param element
 */
function check_validity_and_error(element: HTMLInputElement): boolean
{
	if (!element.checkValidity())
	{
		const is_invalid_class = 'is-invalid';

		console.warn('Input Value is not valid.')
		element.classList.add(is_invalid_class);

		setTimeout(function() {
			if (element.classList.contains(is_invalid_class))
			{
				element.classList.remove(is_invalid_class);
			}
		}, 1500);

		return false;
	}
	return true;
}

/**
 * Toggles the API Warning depending if we want to show an error or not.
 * @param text
 */
function toggle_api_warning(text?: string): void
{
	const element = document.getElementById('bottom_warning');
	const display_none_class = 'd-none';

	if (!text)
	{
		element.classList.add(display_none_class);
		return;
	}

	element.innerText = text;

	if (element.classList.contains(display_none_class))
	{
		element.classList.remove(display_none_class);
	}

}

//Function fills the storage data into the option input form.
async function get_settings(): Promise<void>
{
	const storage_array = (await StorageService.get_pi_hole_settings_array());
	let default_disable_time = (await StorageService.get_default_disable_time());

	let storage: PiHoleSettingsStorage;
	if (typeof storage_array !== "undefined")
	{
		storage = storage_array[0];
	}
	else
	{
		storage = {
			api_key: String(PiHoleSettingsDefaults.api_key),
			pi_uri_base: String(PiHoleSettingsDefaults.pi_uri_base)
		}
	}

	if (typeof default_disable_time !== "undefined")
	{
		default_disable_time = default_disable_time.valueOf();
	}
	else
	{
		default_disable_time = PiHoleSettingsDefaults.default_disable_time;
	}

	(<HTMLInputElement> document.getElementById('pi_uri_base')).defaultValue = storage.pi_uri_base;
	(<HTMLInputElement> document.getElementById('api_key')).defaultValue = storage.api_key;

	const default_time: number = default_disable_time;
	(<HTMLInputElement> document.getElementById('default_time')).defaultValue = String(default_time);
}

document.getElementById('save_button').addEventListener('click', set_settings);   //Action event for when save is pressed
window.addEventListener('load', get_settings);    //Get the API key when the page loads
