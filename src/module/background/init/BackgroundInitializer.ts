import {PiHoleApiStatus, PiHoleApiStatusEnum} from "../../../service/api/models/pihole/PiHoleApiStatus";
import {BadgeService, ExtensionBadgeTextEnum} from "../../../service/browser/BadgeService";
import ContextMenuInitializer from "./ContextMenuInitializer";
import ChromeRuntimeInitializer from "./ChromeRuntimeInitializer";
import {Initializer} from "./Initializer";
import {LegacyPiHoleApiService} from "../../../service/api/service/LegacyPiHoleApiService";

export default class BackgroundInitializer implements Initializer {
    public init(): void {

        (new ContextMenuInitializer()).init();
        (new ChromeRuntimeInitializer()).init();

        this.checkStatus().then();
        window.setInterval(() => this.checkStatus(), 15000);
    }

    /**
     * Checking the current status of the pihole
     *
     */
    private async checkStatus(): Promise<void> {
        const success_callback = (data: PiHoleApiStatus) => {
            BadgeService.getBadgeText().then(function (result) {
                if (!(BadgeService.compareBadgeTextToApiStatusEnum(result, data.status))) {
                    if (data.status === PiHoleApiStatusEnum.disabled) {
                        BadgeService.setBadgeText(ExtensionBadgeTextEnum.disabled);
                    } else if (data.status === PiHoleApiStatusEnum.enabled) {
                        BadgeService.setBadgeText(ExtensionBadgeTextEnum.enabled);
                    }
                }
            })
        };
        LegacyPiHoleApiService.refreshPiHoleStatus(success_callback).then();

    }
}