import {ExtensionBadgeText} from "../../service/browser/BadgeService";
import {PiHoleApiStatus, PiHoleApiStatusEnum} from "../../service/api/models/pihole/PiHoleApiStatus";
import {LinkConfig} from "../../service/browser/i18nService";
import ServiceLocator from "../../service/ServiceLocator";


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
	}
});

// Hook to show a survey after uninstalling the extension
chrome.runtime.setUninstallURL(LinkConfig.uninstall_survey);

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
	const badge_service = ServiceLocator.getInstance().get_badge_service();
	const api_service = ServiceLocator.getInstance().get_api_service();
	const success_callback = (data: PiHoleApiStatus) => {
		badge_service.get_badge_text().then(function(result) {
			if (!(badge_service.compare_badge_to_api_status(result, data.status)))
			{
				if (data.status === PiHoleApiStatusEnum.disabled)
				{
					badge_service.set_badge_text(ExtensionBadgeText.disabled);
				}
				else if (data.status === PiHoleApiStatusEnum.enabled)
				{
					badge_service.set_badge_text(ExtensionBadgeText.enabled);
				}
			}
		})
	};
	api_service.refresh_pi_hole_status(success_callback).then();
}
