<template>
  <div class="option-settings">
    <header class="option-settings__header">
      <h1 class="option-settings__title">
        {{ translate(I18NOptionKeys.options_settings) }}
      </h1>
    </header>

    <v-card flat class="option-settings-card mb-6">
      <v-card-title class="option-settings-card__title pa-6 pb-2">
        <span class="option-settings-card__label">{{
          translate(I18NOptionKeys.options_headline_info)
        }}</span>
      </v-card-title>
      <v-card-text class="px-6 pb-6 pt-2">
        <v-alert
          dense
          outlined
          type="info"
          class="option-settings-card__info mb-6"
        >
          {{ translate(I18NOptionKeys.options_headline_additional_info) }}
        </v-alert>
        <OptionTabComponent />
      </v-card-text>
    </v-card>

    <v-card flat class="option-settings-card">
      <v-card-title class="option-settings-card__title pa-6 pb-2">
        <span class="option-settings-card__label">{{
          translate(I18NOptionKeys.option_settings_general_settings)
        }}</span>
      </v-card-title>
      <v-card-text class="px-6 pb-6 pt-2">
        <div class="option-settings-switches">
          <OptionCheckboxComponent
            v-for="(item, i) in checkboxOptions"
            :key="i"
            :getter-function="item.getterFunction"
            :label-text-key="item.labelTextKey"
            :setter-function="item.setterFunction"
          />
        </div>

        <v-btn
          v-if="!isFirefox"
          rounded
          depressed
          color="secondary"
          class="option-settings-hotkey mt-4"
          @click="openHotKeySettings"
        >
          {{ translate(I18NOptionKeys.option_hotkey_settings) }}
        </v-btn>
      </v-card-text>
    </v-card>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api'
import { I18NOptionKeys } from '../../../../service/i18NService'
import { StorageService } from '../../../../service/StorageService'
import MessageBusService from '../../../../service/MessageBusService'
import useTranslation from '../../../../hooks/translation'
import OptionCheckboxComponent from '../settings/OptionCheckboxComponent.vue'
import OptionTabComponent from '../settings/OptionTabComponent.vue'

export default defineComponent({
  name: 'OptionAboutExtension',
  components: {
    OptionTabComponent,
    OptionCheckboxComponent
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

<style lang="scss">
.option-settings {
  max-width: 720px;
  padding-bottom: 48px;
}

.option-settings__header {
  margin-bottom: 24px;
}

.option-settings__title {
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.option-settings-card {
  border-radius: 12px !important;
  overflow: hidden;
  transition: box-shadow 0.25s ease, border-color 0.25s ease;
}

.theme--dark .option-settings-card {
  border: 1px solid rgba(255, 255, 255, 0.07);
}

.theme--light .option-settings-card {
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06), 0 0 1px rgba(0, 0, 0, 0.04);
}

.option-settings-card__label {
  display: block;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.85px;
  opacity: 0.45;
}

.option-settings-card__info {
  border-radius: 8px !important;
  font-size: 13px !important;
  line-height: 1.5 !important;
}

.option-settings-switches .v-input--switch {
  margin-top: 4px;
  margin-bottom: 4px;
}

.option-settings-hotkey {
  text-transform: none !important;
  font-weight: 600 !important;
  letter-spacing: 0.02em !important;
}
</style>
