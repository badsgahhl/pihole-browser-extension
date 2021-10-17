<template>
  <div>
    <h2 class="pb-3 mt-0">
      {{ translate(I18NOptionKeys.options_settings) }}
    </h2>
    <v-card>
      <v-card-title>
        👉🏼 {{ translate(I18NOptionKeys.options_headline_info) }}
      </v-card-title>
      <v-card-text>
        <OptionTabComponent />

        <OptionDisableTimeComponent />

        <OptionGenericCheckboxComponent
          v-for="(item, i) in checkboxOptions"
          :key="i"
          :getter-function="item.getterFunction"
          :label-text-key="item.labelTextKey"
          :setter-function="item.setterFunction"
        />

        <v-btn v-if="!isFirefox" class="mt-3" @click="openHotKeySettings">
          {{ translate(I18NOptionKeys.option_hotkey_settings) }}
        </v-btn>
      </v-card-text>
    </v-card>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api'
import { I18NOptionKeys } from '../../../../service/i18NService'
import OptionDisableTimeComponent from './OptionDisableTimeComponent.vue'
import OptionTabComponent from './OptionTabComponent.vue'
import OptionGenericCheckboxComponent from './OptionGenericCheckboxComponent.vue'
import { StorageService } from '../../../../service/StorageService'
import MessageBusService from '../../../../service/MessageBusService'
import useTranslation from '../../../../hooks/translation'

export default defineComponent({
  name: 'OptionAboutExtension',
  components: {
    OptionDisableTimeComponent,
    OptionTabComponent,
    OptionGenericCheckboxComponent
  },
  setup: () => {
    const { translate } = useTranslation()

    const checkboxOptions: GenericCheckboxComponent[] = [
      {
        labelTextKey: I18NOptionKeys.options_reload_after_disable,
        getterFunction: () => StorageService.getReloadAfterDisable(),
        setterFunction: (value: boolean) =>
          StorageService.saveReloadAfterDisable(value)
      },
      {
        labelTextKey: I18NOptionKeys.options_reload_after_white_list,
        getterFunction: () => StorageService.getReloadAfterWhitelist(),
        setterFunction: (value: boolean) =>
          StorageService.saveReloadAfterWhitelist(value)
      },
      {
        labelTextKey: I18NOptionKeys.option_disable_feature,
        getterFunction: () => StorageService.getDisableListFeature(),
        setterFunction: (value: boolean) =>
          StorageService.saveDisableListFeature(value)
      },
      {
        labelTextKey: I18NOptionKeys.option_disable_update_notification,
        getterFunction: () => StorageService.getDisableUpdateNotification(),
        setterFunction: (value: boolean) =>
          StorageService.saveDisableUpdateNotification(value)
      },
      {
        labelTextKey: I18NOptionKeys.option_disable_context_menu,
        getterFunction: () => StorageService.getDisableContextMenu(),
        setterFunction: (value: boolean) => {
          MessageBusService.sendContextMenuSwitchMessage(value)
          StorageService.saveDisableContextMenu(value)
        }
      }
    ]

    const isFirefox = computed(() => typeof browser !== 'undefined')

    const openHotKeySettings = () => {
      // eslint-disable-next-line no-undef
      chrome.tabs.create({
        url: 'chrome://extensions/shortcuts'
      })
    }

    return {
      openHotKeySettings,
      isFirefox,
      checkboxOptions,
      translate,
      I18NOptionKeys
    }
  }
})

/**
 * Interface that represents a checkbox option in the settings
 */
interface GenericCheckboxComponent {
  labelTextKey: I18NOptionKeys
  getterFunction: () => Promise<boolean | undefined> | Promise<boolean>
  setterFunction: (value: boolean) => void
}
</script>
