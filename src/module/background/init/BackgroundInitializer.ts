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

    this.createAlarm().then(
      () => {
        this.addAlarmListener()
      },
      () => {
        console.error('Failed to create alarm')
      }
    )
  }

  private async createAlarm() {
    if (typeof browser !== 'undefined') {
      browser.alarms.create(this.ALARM_NAME, {
        periodInMinutes: this.INTERVAL_TIMEOUT / 60000
      })
    } else {
      await chrome.alarms.create(this.ALARM_NAME, {
        periodInMinutes: this.INTERVAL_TIMEOUT / 60000
      })
    }
  }

  private addAlarmListener() {
    if (typeof browser !== 'undefined') {
      browser.alarms.onAlarm.addListener(alarm => {
        if (alarm.name === this.ALARM_NAME) {
          this.checkStatus()
        }
      })
    } else {
      chrome.alarms.onAlarm.addListener(alarm => {
        if (alarm.name === this.ALARM_NAME) {
          this.checkStatus()
        }
      })
    }
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
