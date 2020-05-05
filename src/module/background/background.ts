import {BadgeService, ExtensionBadgeText} from "../../data/storage/BadgeService.js";
import {PiHoleApiStatus, PiHoleApiStatusEnum} from "../../data/api/models/pihole/PiHoleApiStatus.js";
import {PiHoleSettingsDefaults, PiHoleSettingsStorage, StorageAccessService} from "../../data/storage/StorageAccessService.js";
import {ApiRequestService} from "../../data/api/service/ApiRequestService.js";

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
async function checkStatus(): Promise<void>
{
	const api_request: ApiRequestService = new ApiRequestService();

	const onreadystatechange = function() {
		if (this.readyState === 4 && this.status === 200)
		{
			const data: PiHoleApiStatus = JSON.parse(this.response);
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

	api_request.add_param('status');
	api_request.set_onreadystatechange(onreadystatechange);

	await api_request.send();
}

/**
 * Initialising a default domain if none is set.
 */
async function init(): Promise<void>
{
	const storage: PiHoleSettingsStorage = await StorageAccessService.get_pi_hole_settings();

	if (!storage.pi_uri_base)
	{
		const storage: PiHoleSettingsStorage = {pi_uri_base: "http://pi.hole"};

		StorageAccessService.save_to_local_storage(storage, function() {
			console.log("Set default URL to http://pi.hole");
		});
	}
	else
	{
		console.log("Current URI base: " + storage.pi_uri_base);
	}

	if (!storage.default_disable_time)
	{
		const storage: PiHoleSettingsStorage = {default_disable_time: PiHoleSettingsDefaults.default_disable_time.valueOf()};
		StorageAccessService.save_to_local_storage(storage);
	}
}
