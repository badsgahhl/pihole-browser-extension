import {StorageService} from "../../service/browser/StorageService";
import {PiHoleApiService} from "../../service/api/service/PiHoleApiService";
import {BadgeService, ExtensionBadgeText} from "../../service/browser/BadgeService";
import {PiHoleApiStatus, PiHoleApiStatusEnum} from "../../service/api/models/pihole/PiHoleApiStatus";


chrome.runtime.onInstalled.addListener(function(details) {
	if (details.reason == "install")
	{
		console.log("This is a first install!");
	}
	else if (details.reason == "update" && details.previousVersion)
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
window.setInterval(checkStatus, 15000); //Keep checking every 15 seconds

/**
 * Checking the current status of the pihole
 *
 */
async function checkStatus(): Promise<void>
{
	const success_callback = (data: PiHoleApiStatus) => {
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
	};
	PiHoleApiService.refresh_pi_hole_status(success_callback).then();
}
