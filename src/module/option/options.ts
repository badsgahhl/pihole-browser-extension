import {PiHoleSettingsDefaults, PiHoleSettingsStorage, StorageService} from "../../data/storage/StorageService";
import "./options.css";
import "../general/darkmode.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap";
import * as $ from "jquery";

/**
 * Saves the extension settings to the local storage.
 */
async function set_settings(): Promise<void>
{
	const default_disable_time_input: HTMLInputElement = (<HTMLInputElement> document.getElementById('default_time'));

	const settings_tabs = document.getElementsByClassName('tab-pane');
	let pi_holes_with_invalid_api_key: Array<number> = [];
	StorageService.clear_pi_hole_settings();

	for (let i = 0; i < settings_tabs.length; i++)
	{
		const counter = i + 1;
		const setting_tab = settings_tabs.item(i);
		const url_element = <HTMLInputElement> setting_tab.querySelector('#pi_uri_base' + counter);
		const api_element = <HTMLInputElement> setting_tab.querySelector('#api_key' + counter);


		const api_key = api_element.value.replace(/\s+/g, '');
		const pi_uri_base = url_element.value.replace(/\s+/g, '');

		if (!api_key.match('^[a-f0-9]{64}$') && api_key.length !== 0)
		{
			pi_holes_with_invalid_api_key.push(counter);
		}

		const settings_storage: PiHoleSettingsStorage = {
			pi_uri_base: pi_uri_base,
			api_key: api_key,
		};


		await StorageService.add_pi_hole_settings(settings_storage);
	}

	if (pi_holes_with_invalid_api_key.length > 0)
	{
		let invalid_pi_holes_text = '';

		for (let i = 0; i < pi_holes_with_invalid_api_key.length; i++)
		{
			const pi_hole = pi_holes_with_invalid_api_key[i];
			invalid_pi_holes_text += 'Pihole ' + pi_hole;

			if (pi_holes_with_invalid_api_key.length > 1 && i < pi_holes_with_invalid_api_key.length - 1)
			{
				invalid_pi_holes_text += ', '
			}
		}
		invalid_pi_holes_text = '(' + invalid_pi_holes_text + ')';

		toggle_api_warning('Api Key doesn\'t match scheme (64 chars long). It may be invalid!' + invalid_pi_holes_text);
	}
	else
	{
		toggle_api_warning();
	}

	if (!check_validity_and_error(default_disable_time_input))
	{
		return;
	}

	const save_button: HTMLButtonElement = <HTMLButtonElement> document.getElementById('save_button');
	const button_saved: () => void = function() {
		const btn_default: string = save_button.textContent;
		save_button.disabled = true;
		save_button.textContent = 'Saved!';
		setTimeout(function() {
			save_button.textContent = btn_default;
			save_button.disabled = false;
		}, 1500);
	}

	StorageService.save_default_disable_time(default_disable_time_input.valueAsNumber);
	button_saved();
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

/**
 * Function to load the settings from the storage and show the formula
 */
async function get_settings(): Promise<void>
{
	let storage_array = (await StorageService.get_pi_hole_settings_array());
	let default_disable_time = (await StorageService.get_default_disable_time());

	if (typeof storage_array === "undefined")
	{
		storage_array = [
			{
				api_key: String(PiHoleSettingsDefaults.api_key),
				pi_uri_base: String(PiHoleSettingsDefaults.pi_uri_base)
			}
		];
	}

	for (let i = 0; i < storage_array.length; i++)
	{
		render_tab(storage_array[i], i + 1, i === 0);
	}

	change_add_remove_button_by_number(storage_array.length);

	if (typeof default_disable_time !== "undefined")
	{
		default_disable_time = default_disable_time.valueOf();
	}
	else
	{
		default_disable_time = PiHoleSettingsDefaults.default_disable_time;
	}
	const default_time: number = default_disable_time;
	(<HTMLInputElement> document.getElementById('default_time')).defaultValue = String(default_time);
}

/**
 * Function to change the add/remove Button depending on a number
 * @param number Should be the amount of tabs or settings that were loaded.
 */
function change_add_remove_button_by_number(number: number): void
{
	if (number < 4)
	{
		enable_add_pi_hole_button();
	}
	else
	{
		remove_add_pi_hole_button();
	}
	if (number > 1)
	{
		enable_remove_pi_hole_button();
	}
	else
	{
		remove_remove_pi_hole_button();
	}
}

/**
 * Function that renders the add pi hole button if non is existent
 */
function enable_add_pi_hole_button(): void
{
	const add_settings_button = 'add_settings';
	let button = document.getElementById(add_settings_button);

	if (button === null)
	{
		button = document.createElement('button');
		button.id = add_settings_button;
		button.classList.add('btn', 'btn-success');
		button.innerHTML = '<svg class="bi bi-plus-circle" width="20px" height="20px" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">\n' +
								 '  <path fill-rule="evenodd" d="M8 3.5a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5H4a.5.5 0 0 1 0-1h3.5V4a.5.5 0 0 1 .5-.5z"/>\n' +
								 '  <path fill-rule="evenodd" d="M7.5 8a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1H8.5V12a.5.5 0 0 1-1 0V8z"/>\n' +
								 '  <path fill-rule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>\n' +
								 '</svg>';

		button.title = 'Add';

		button.addEventListener('click', function() {

			const default_settings:PiHoleSettingsStorage = {
				api_key: String(PiHoleSettingsDefaults.api_key),
				pi_uri_base: String(PiHoleSettingsDefaults.pi_uri_base)
			};

			const counter = document.getElementById('settings_tabs').childElementCount + 1;
			render_tab(default_settings, counter, false);
			$('#pi_hole_setting' + (counter)).tab('show');

			const tabs = document.getElementById('settings_tabs');
			change_add_remove_button_by_number(tabs.childElementCount);
		});

		const input_buttons = document.getElementById('pi_hole_input_buttons');
		input_buttons.insertBefore(button, input_buttons.firstChild);
	}
}

/**
 * Function to remove the add pi hole button
 */
function remove_add_pi_hole_button(): void
{
	const add_settings_button = 'add_settings';
	let button = document.getElementById(add_settings_button);
	if (button !== null)
	{
		button.remove();
	}
}

/**
 * Function to render the remove pi hole button if non existent
 */
function enable_remove_pi_hole_button(): void
{
	const remove_button_id = 'remove_settings';
	let button = document.getElementById(remove_button_id);

	if (button === null)
	{
		button = document.createElement('button');
		button.id = remove_button_id;
		button.classList.add('btn', 'btn-danger');
		button.innerHTML = '<svg class="bi bi-x-circle" width="20px" height="20px" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">\n' +
								 '  <path fill-rule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>\n' +
								 '  <path fill-rule="evenodd" d="M11.854 4.146a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708-.708l7-7a.5.5 0 0 1 .708 0z"/>\n' +
								 '  <path fill-rule="evenodd" d="M4.146 4.146a.5.5 0 0 0 0 .708l7 7a.5.5 0 0 0 .708-.708l-7-7a.5.5 0 0 0-.708 0z"/>\n' +
								 '</svg>';

		button.title = 'Remove';

		button.addEventListener('click', function() {
			const tabs = document.getElementById('settings_tabs');
			let last_child_was_selected = tabs.lastElementChild.lastElementChild.classList.contains('active');
			tabs.removeChild(tabs.lastChild);
			const tabs_content = document.getElementById('pi_hole_settings_tab_content');
			tabs_content.removeChild(tabs_content.lastChild);

			if (last_child_was_selected) {
				$('#pi_hole_setting' + tabs.childElementCount).tab('show');
			}
			change_add_remove_button_by_number(tabs.childElementCount);
		});

		document.getElementById('pi_hole_input_buttons').append(button);
	}
}

/**
 * Function to remove the remove pi hole button
 */
function remove_remove_pi_hole_button(): void
{
	const remove_button_id = 'remove_settings';
	let button = document.getElementById(remove_button_id);
	if (button !== null)
	{
		button.remove();
	}
}

/**
 * Function to render a bootstrap tab with its content
 * @param settings
 * @param counter
 * @param active
 */
function render_tab(settings: PiHoleSettingsStorage, counter: number, active: boolean): void
{
	const tab = document.createElement('li');
	tab.classList.add('nav-item');

	const tab_link = document.createElement('a');
	tab_link.classList.add('nav-link');
	if (active)
	{
		tab_link.classList.add('active');
	}
	tab_link.id = 'pi_hole_setting' + counter;
	tab_link.setAttribute('data-toggle', 'tab');
	tab_link.setAttribute('role', 'tab');
	tab_link.setAttribute('aria-selected', active ? 'true' : 'false');

	const content_id = 'pi_hole_setting_content' + counter;

	tab_link.setAttribute('aria-controls', content_id)
	tab_link.setAttribute('href', '#' + content_id);
	tab_link.innerText = 'PiHole ' + counter;

	tab.appendChild(tab_link);
	document.getElementById('settings_tabs').appendChild(tab);


	const content_div = document.createElement('div');
	content_div.classList.add('tab-pane', 'fade');
	if (active)
	{
		content_div.classList.add('active', 'show');
	}
	content_div.id = content_id;
	content_div.setAttribute('role', 'tabpanel');

	content_div.appendChild(get_settings_form(settings.pi_uri_base, counter, 'pi_uri_base', 'Pi-Hole Address'));
	content_div.appendChild(get_settings_form(settings.api_key, counter, 'api_key', 'API Key'));


	document.getElementById('pi_hole_settings_tab_content').appendChild(content_div);
}

/**
 * Function to create a HTMLElement settings form with pre filled data
 * @param value
 * @param counter
 * @param id
 * @param name
 */
function get_settings_form(value: string, counter: number, id: string, name: string): HTMLDivElement
{
	const pi_hole_url_form = document.createElement('div');
	pi_hole_url_form.classList.add('form-group');

	pi_hole_url_form.appendChild(get_label_input(id + counter, name));
	pi_hole_url_form.appendChild(get_input_input(id + counter, name, value));

	return pi_hole_url_form;
}

/**
 * Function to get a HTMLElement Label
 * @param id
 * @param name
 */
function get_label_input(id: string, name: string): HTMLLabelElement
{
	const label = document.createElement('label');
	label.setAttribute('for', id);
	label.innerText = name + ':';

	return label;
}

/**
 * Function to get a HTMLElement Input
 * @param id
 * @param name
 * @param value
 */
function get_input_input(id: string, name: string, value: string): HTMLInputElement
{
	const input = document.createElement('input');
	input.classList.add('form-control')
	input.setAttribute('type', 'text')
	input.id = id;
	input.name = name;
	input.value = value;

	return input;
}

document.getElementById('save_button').addEventListener('click', set_settings);   //Action event for when save is pressed
window.addEventListener('load', get_settings);    //Get the API key when the page loads
