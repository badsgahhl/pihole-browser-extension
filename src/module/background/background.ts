import {ExtensionStorageEnum, StorageService} from "../../data/storage/StorageService";
import {PiHoleApiService} from "../../data/api/service/PiHoleApiService";
import {BadgeService, ExtensionBadgeText} from "../../data/storage/BadgeService";
import {PiHoleApiStatus, PiHoleApiStatusEnum} from "../../data/api/models/pihole/PiHoleApiStatus";


chrome.runtime.onInstalled.addListener(function(details) {
	if (details.reason == "install")
	{
		console.log("This is a first install!");
	}
	else if (details.reason == "update")
	{
		const previousVersion = Number(details.previousVersion.split('.').join(''));
		const thisVersion = Number(chrome.runtime.getManifest().version.split('.').join(''));
		console.log("Updated from " + previousVersion + " to " + thisVersion + "!");

		/**
		 * Update Roadmap:
		 * 2.1.1 Pushing new codebase for storage service
		 * 2.1.2 Migration + Making Methods ready to work with multiple pi holes
		 * 2.2.0 Allowing multiple pihole in the settings
		 */
		if (previousVersion <= 211 && thisVersion > 211)
		{
			console.log("Running migration");
			StorageService.process_storage_migration();
		}
	}
});

// Hook to show a survey after uninstalling the extension
chrome.runtime.setUninstallURL('https://forms.gle/RsGUyrmB1jtsGhYQ9');

/**
 * Background Service
 * Initialises the pihole domain, checks the pihole status.
 */
checkStatus().then();  //Get the current status when the browser opens
init_disable_after_new_tab().then();
window.setInterval(checkStatus, 15000); //Keep checking every 15 seconds

/**
 * Checking the current status of the pihole
 *
 */
async function checkStatus(): Promise<void>
{
	const success_callback = (data) => background_badge_text_success_handler(data);
	PiHoleApiService.refresh_pi_hole_status(success_callback).then();
}

/**
 * Eventlistener to get if the settings were saved, and to init or remove the
 * disable_after_new_tab event handler
 */
chrome.runtime.onMessage.addListener((message) => {
	if (message.text === ExtensionStorageEnum.disable_after_new_tab)
	{
		init_disable_after_new_tab().then();
	}
});

async function init_disable_after_new_tab()
{
	let disable_after_new_tab = (await StorageService.get_disable_after_new_tab());
	const event_handler_initialised = chrome.tabs.onCreated.hasListener(disable_after_new_tab_handler);

	if (disable_after_new_tab && !event_handler_initialised)
	{
		chrome.tabs.onCreated.addListener(disable_after_new_tab_handler);
	}
	else if (!disable_after_new_tab && event_handler_initialised)
	{
		chrome.tabs.onCreated.removeListener(disable_after_new_tab_handler);
	}
}

function disable_after_new_tab_handler()
{
	const empty_callback = () => {
	};
	const success_callback = (data) => background_badge_text_success_handler(data);
	PiHoleApiService.change_pi_hole_status(PiHoleApiStatusEnum.disabled, 5, (data) => success_callback(data), empty_callback).then();
}

function background_badge_text_success_handler(data: PiHoleApiStatus)
{
	BadgeService.get_badge_text().then(function(result) {
		if (!(BadgeService.compare_badge_to_api_status(result, data.status)))
		{
			if (data.status === PiHoleApiStatusEnum.disabled)
			{
				BadgeService.set_badge_text(ExtensionBadgeText.disabled);
			}
			else if (data.status === PiHoleApiStatusEnum.enabled)
			{
				BadgeService.set_badge_text(ExtensionBadgeText.enabled);
			}
		}
	})
}
