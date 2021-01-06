import {Initializer} from "./Initializer";
import {LinkConfig} from "../../../service/browser/I18nService";

export default class ChromeRuntimeInitializer implements Initializer {
    public init(): void {
        chrome.runtime.onInstalled.addListener(function (details) {
            if (details.reason == "install") {
                console.log("This is a first install!");
            } else if (details.reason == "update" && details.previousVersion) {
                const previousVersion = Number(details.previousVersion.split('.').join(''));
                const thisVersion = Number(chrome.runtime.getManifest().version.split('.').join(''));
                console.log("Updated from " + previousVersion + " to " + thisVersion + "!");
            }
        });

        // Hook to show a survey after uninstalling the extension
        chrome.runtime.setUninstallURL(LinkConfig.uninstall_survey);
    }

}