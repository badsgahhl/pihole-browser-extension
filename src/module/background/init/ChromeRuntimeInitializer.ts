import { Initializer } from '../../general/Initializer';
import { LinkConfig } from '../../../service/i18NService';
import { PiHoleSettingsDefaults, StorageService } from '../../../service/StorageService';
import { BadgeService, ExtensionBadgeTextEnum } from '../../../service/BadgeService';

export default class ChromeRuntimeInitializer implements Initializer {
  public init(): void {
    chrome.runtime.onInstalled.addListener(details => {
      if (details.reason === 'install') {
        StorageService.saveDefaultDisableTime(
          Number(PiHoleSettingsDefaults.default_disable_time)
        )
        StorageService.saveReloadAfterDisable(true)
        StorageService.saveReloadAfterWhitelist(true)
      } else if (details.reason === 'update' && details.previousVersion) {
        const previousVersion = Number(
          details.previousVersion.split('.').join('')
        )
        const thisVersion = Number(
          chrome.runtime
            .getManifest()
            .version.split('.')
            .join('')
        )
        console.log(`Updated from ${previousVersion} to ${thisVersion}!`)

        // Clear all settings if update from any version to 4.0.0
        if (previousVersion < 400 && thisVersion >= 400) {
          StorageService.clearStorage().then(() => {
            StorageService.saveDefaultDisableTime(
              Number(PiHoleSettingsDefaults.default_disable_time)
            )
            StorageService.saveReloadAfterDisable(true)
            StorageService.saveReloadAfterWhitelist(true)
            // Set badge to INFO
           BadgeService.setBadgeText(ExtensionBadgeTextEnum.info)
          })
        }
      }
    })

    // Hook to show a survey after uninstalling the extension
    chrome.runtime.setUninstallURL(LinkConfig.uninstall_survey)
  }
}
