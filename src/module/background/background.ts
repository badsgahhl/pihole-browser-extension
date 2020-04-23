import {ChromeFunctions} from "../../utils/ChromeFunctions.js";
import {PiHoleApiStatus, PiHoleApiStatusEnum} from "../../data/api/models/pihole/PiHoleApiStatus.js";
import {
	ExtensionBadgeText,
	PiHoleSettingsStorage,
	StorageAccess
} from "../../data/storage/StorageAccess.js";

init().then();
checkStatus().then();  //Get the current status when the browser opens
window.setInterval(checkStatus, 15000); //Keep checking every 15 seconds

//Get the current status
async function checkStatus() {
	const httpResponse = new XMLHttpRequest();
	httpResponse.onreadystatechange = function() {
		if (this.readyState === 4 && this.status === 200) {

			const data:PiHoleApiStatus = JSON.parse(this.response);
			ChromeFunctions.get_badge_text().then(function(result) {
				if (!(ChromeFunctions.compare_badge_to_api_status(result, data.status))) {
					if (data.status === PiHoleApiStatusEnum.disabled) {

						ChromeFunctions.set_badge_text(ExtensionBadgeText.disabled);
					} else if (data.status === PiHoleApiStatusEnum.enabled) {

						ChromeFunctions.set_badge_text(ExtensionBadgeText.enabled);
					}
				}
			})


		} else {
			//set_badge_text('');
		}
	};
	const url = (await StorageAccess.get_pi_hole_settings()).pi_uri_base;
	httpResponse.open("GET", url + "/api.php?", true);
	httpResponse.send();
}


async function init() {
	const storage:PiHoleSettingsStorage = await StorageAccess.get_pi_hole_settings();

	if (!storage.pi_uri_base) {
		const storage:PiHoleSettingsStorage = {pi_uri_base: "http://pi.hole"};
		chrome.storage.local.set(storage, function() {
			console.log("Set default URL to http://pi.hole");
		});
	} else {
		console.log("Current URI base: " + storage.pi_uri_base);
	}
}
