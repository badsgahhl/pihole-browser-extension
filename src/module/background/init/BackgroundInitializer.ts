import {
  BadgeService,
  ExtensionBadgeTextEnum
} from '../../../service/BadgeService'
import ContextMenuInitializer from './ContextMenuInitializer'
import ChromeRuntimeInitializer from './ChromeRuntimeInitializer'
import { Initializer } from '../../general/Initializer'
import PiHoleApiService from '../../../service/PiHoleApiService'
import PiHoleApiStatusEnum from '../../../api/enum/PiHoleApiStatusEnum'
import HotKeyInitializer from './HotKeyInitializer'

export default class BackgroundInitializer implements Initializer {
  private readonly ALARM_NAME = 'pihole.checkStatus'

  private readonly INTERVAL_TIMEOUT = 30000

  public init(): void {
    BadgeService.setBadgeText('')

    new ContextMenuInitializer().init()
    new ChromeRuntimeInitializer().init()
    new HotKeyInitializer().init()

    this.checkStatus().then()
    chrome.alarms
      .create(this.ALARM_NAME, {
        periodInMinutes: this.INTERVAL_TIMEOUT / 60000
      })
      .then(() => {
        chrome.alarms.onAlarm.addListener(alarm => {
          if (alarm.name === this.ALARM_NAME) {
            this.checkStatus()
          }
        })
      })
  }

  /**
   * Checking the current status of the PiHole(s)
   */
  private async checkStatus(): Promise<void> {
    PiHoleApiService.getPiHoleStatusCombined().then(value => {
      BadgeService.getBadgeText().then(result => {
        if (!BadgeService.compareBadgeTextToApiStatusEnum(result, value)) {
          if (value === PiHoleApiStatusEnum.disabled) {
            BadgeService.setBadgeText(ExtensionBadgeTextEnum.disabled)
          } else if (value === PiHoleApiStatusEnum.enabled) {
            BadgeService.setBadgeText(ExtensionBadgeTextEnum.enabled)
          }
        }
      })
    })
  }
}
