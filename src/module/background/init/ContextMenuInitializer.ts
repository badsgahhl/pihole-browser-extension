import { Initializer } from '../../general/Initializer'
import { I18NContextMenuKeys, I18NService } from '../../../service/i18NService'
import BackgroundService from '../../../service/BackgroundService'
import {
  ContextMenuSwitchMessage,
  MessageEnum
} from '../../../service/MessageBusService'
import { StorageService } from '../../../service/StorageService'
import CreateProperties = chrome.contextMenus.CreateProperties

export default class ContextMenuInitializer implements Initializer {
  private get contextMenusConfigurations(): CreateProperties[] {
    return [
      {
        title: I18NService.translate(I18NContextMenuKeys.toggle_pi_holes),
        contexts: ['page'],
        onclick: () => {
          BackgroundService.togglePiHole()
        }
      },
      {
        type: 'separator',
        contexts: ['page']
      },
      {
        title: I18NService.translate(
          I18NContextMenuKeys.blacklist_current_domain
        ),
        contexts: ['page'],
        onclick: () => {
          BackgroundService.blacklistCurrentDomain()
        }
      },
      {
        title: I18NService.translate(
          I18NContextMenuKeys.whitelist_current_domain
        ),
        contexts: ['page'],
        onclick: () => {
          BackgroundService.whitelistCurrentDomain()
        }
      },
      {
        type: 'separator',
        contexts: ['page']
      },
      {
        title: I18NService.translate(I18NContextMenuKeys.open_settings),
        contexts: ['page'],
        onclick: () => BackgroundService.openOptions()
      }
    ]
  }

  init(): void {
    StorageService.getDisableContextMenu().then(value => {
      this.removeOrCreateContextMenuByBoolean(value)
    })
    this.initMessageListener()
  }

  private initMessageListener(): void {
    chrome.runtime.onMessage.addListener(
      (request: ContextMenuSwitchMessage) => {
        if (request.message === MessageEnum.ContextMenuSwitch) {
          this.removeOrCreateContextMenuByBoolean(request.payload)
        }
      }
    )
  }

  private removeOrCreateContextMenuByBoolean(state: boolean): void {
    chrome.contextMenus.removeAll()
    if (!state) {
      this.createContextMenu()
    }
  }

  private createContextMenu(): void {
    for (const [idx, contextMenusConfiguration] of Object.entries(
      this.contextMenusConfigurations
    )) {
      chrome.contextMenus.create({
        ...contextMenusConfiguration,
        id: idx,
        onclick: undefined
      })
    }
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      this.contextMenusConfigurations[info.menuItemId as number].onclick?.(
        info,
        tab!
      )
    })
  }
}
