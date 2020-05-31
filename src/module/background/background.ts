import {BadgeService, ExtensionBadgeText} from "../../data/storage/BadgeService";
import {PiHoleApiStatus, PiHoleApiStatusEnum} from "../../data/api/models/pihole/PiHoleApiStatus";
import {PiHoleSettingsDefaults, PiHoleSettingsStorageOld, StorageService} from "../../data/storage/StorageService";
import {PiHoleApiRequest} from "../../data/api/service/PiHoleApiRequest";
import {ApiJsonErrorMessages} from "../../data/api/errors/ApiErrorMessages";


chrome.runtime.onInstalled.addListener(function(details) {
	if (details.reason == "install") {
		console.log("This is a first install!");
	} else if (details.reason == "update") {
		const thisVersion = chrome.runtime.getManifest().version;
		console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");

		/**
		 * Update Roadmap:
		 * 2.1.1 Pushing new codebase for storage service
		 * 2.1.2 Migration + Making Methods ready to work with multiple pi holes
		 * 2.2.0 Allowing multiple pihole in the settings
		 */
		if (details.previousVersion === '2.1.1' && thisVersion === '2.1.2') {
			StorageService.process_storage_migration();
		}
	}
});


/**
 * Background Service
 * Initialises the pihole domain, checks the pihole status.
 */
init().then();
checkStatus().then();  //Get the current status when the browser opens
window.setInterval(checkStatus, 15000); //Keep checking every 15 seconds

/**
 * Checking the current status of the pihole
 *
 */
async function checkStatus():Promise<void> {
	const api_request:PiHoleApiRequest = new PiHoleApiRequest();

	const onreadystatechange = function() {
		if (this.readyState === 4 && this.status === 200)
		{
			let data: PiHoleApiStatus
			try
			{
				data = JSON.parse(this.response);
			}
			catch (e)
			{
				console.warn(ApiJsonErrorMessages.invalid);
				return;
			}
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
			});
		}
		else if (this.status !== 200 && this.status !== 0)
		{
			console.log(this.status);
			BadgeService.set_badge_text(ExtensionBadgeText.error);
		}
	};

	api_request.add_get_param('status');
	api_request.onreadystatechange = onreadystatechange;

	await api_request.send();
}

/**
 * Initialising a default domain if none is set.
 */
async function init(): Promise<void> {
	const storage:PiHoleSettingsStorageOld = await StorageService.get_pi_hole_settings();

	if (!storage.pi_uri_base) {
		const storage:PiHoleSettingsStorageOld = {pi_uri_base: PiHoleSettingsDefaults.pi_uri_base.valueOf()};

		StorageService.save_to_local_storage(storage, function() {
			console.log("Set default URL to http://pi.hole");
		});
	} else
	{
		console.log("Current URI base: " + storage.pi_uri_base);
	}

	if (!storage.default_disable_time) {
		const storage:PiHoleSettingsStorageOld = {default_disable_time: PiHoleSettingsDefaults.default_disable_time.valueOf()};
		StorageService.save_to_local_storage(storage);
	}
}
