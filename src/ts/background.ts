import {PiHoleStorageAccess, read_pi_hole_storage} from "./utils/StorageAccess.js";
import {set_badge_text} from "./utils/ChromeFunctions.js";
import {PiHoleApiStatus, PiHoleApiStatusEnum} from "./utils/PiHoleModels.js";

init().then();
checkStatus().then();  //Get the current status when the browser opens
window.setInterval(checkStatus, 30000); //Keep checking every 30 seconds

//Get the current status
async function checkStatus() {
    const httpResponse = new XMLHttpRequest();
    httpResponse.onreadystatechange = function() {
        if (this.readyState === 4 && this.status === 200) {

            const data:PiHoleApiStatus = JSON.parse(this.response);
            if (data.status === PiHoleApiStatusEnum.disabled) {
                set_badge_text('Off');
            } else if (data.status === PiHoleApiStatusEnum.enabled) {
                set_badge_text('On');
            }
        } else {
            set_badge_text('');
        }
    };
    const url = (await read_pi_hole_storage()).pi_uri_base;
    httpResponse.open("GET", url + "/api.php?", true);
    httpResponse.send();
}


async function init() {
    const storage:PiHoleStorageAccess = await read_pi_hole_storage();

    if (!storage.pi_uri_base) {
        const storage:PiHoleStorageAccess = {pi_uri_base: "http://pi.hole"};
        chrome.storage.local.set(storage, function() {
            console.log("Set default URL to http://pi.hole");
        });
    } else {
        console.log("Current URI base: " + storage.pi_uri_base);
    }
}
