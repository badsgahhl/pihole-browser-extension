import {get_storage_access, PiHoleStorage} from "./utils/StorageAccess.js";


init();
checkStatus().then();  //Get the current status when the browser opens
window.setInterval(checkStatus, 30000); //Keep checking every 30 seconds

//Get the current status
export async function checkStatus() {
    const httpResponse = new XMLHttpRequest();    //make a new request
    httpResponse.onreadystatechange = function() {
        if (this.readyState === 4 && this.status === 200) {
            // Action to be performed when the document is read;
            const data = JSON.parse(this.response);
            if (data.status === "disabled") {  //If disabled set badge
                chrome.browserAction.setBadgeText({text: "Off"});
            } else if (data.status === 'enabled') {    //else turn on badge
                chrome.browserAction.setBadgeText({text: "On"});
            }
        } else {
            chrome.browserAction.setBadgeText({text: ""});
        }
    };
    const url = await get_storage_access().read(PiHoleStorage.URI);
    httpResponse.open("GET", url + "/api.php?", true);
    httpResponse.send();
}

function init()
{
	chrome.storage.local.get('pi_uri_base', function (data) {
		if(data.pi_uri_base === '')
        {
			chrome.storage.local.set({pi_uri_base: "http://pi.hole"}, function () {
                console.log("Set default URL to http://pi.hole");
            });
        } else {
			console.log("Current URI base: "+data.pi_uri_base);
		}
    });
	
    chrome.storage.local.getBytesInUse(['max_time'], function(bytes){
        if(bytes === 0)
        {
            chrome.storage.local.set({max_time: 0}, function () {
                console.log("Set Max time");
            });
        }
    });
}
