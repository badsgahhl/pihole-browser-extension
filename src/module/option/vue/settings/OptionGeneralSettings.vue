<template>
  <b-card-text>
    <h2 class="pb-3 mt-0">
      {{ translate(i18nOptionsKeys.options_settings) }}
    </h2>
    <b-card
      class="shadow"
      no-body
    >
      <b-card-header class="h6">
        👉🏼 {{ translate(i18nOptionsKeys.options_headline_info) }}
      </b-card-header>
      <b-card-body>
        <OptionTabComponent />

        <OptionDisableTimeComponent />

        <OptionGenericCheckboxComponent
          v-for="item in checkbox_options"
          :key="item.key"
          :getter_function="item.getter_function"
          :label_text_key="item.label_text_key"
          :setter_function="item.setter_function"
        />
        <b-button
          v-if="!isFirefox"
          class="btn mt-3"
          @click="openHotKeySettings"
        >
          {{ translate(i18nOptionsKeys.option_hotkey_settings) }}
        </b-button>
      </b-card-body>
    </b-card>
  </b-card-text>
</template>

<script lang="ts">
import { Component } from 'vue-property-decorator';
import { I18NOptionKeys } from '../../../../service/i18NService';
import OptionDisableTimeComponent from './OptionDisableTimeComponent.vue';
import OptionTabComponent from './OptionTabComponent.vue';
import OptionGenericCheckboxComponent from './OptionGenericCheckboxComponent.vue';
import BaseComponent from '../../../general/BaseComponent.vue';
import { StorageService } from '../../../../service/StorageService';
import MessageBusService from '../../../../service/MessageBusService';

@Component({
  components: {
    OptionDisableTimeComponent, OptionTabComponent, OptionGenericCheckboxComponent,
  },
})
export default class OptionGeneralSettings extends BaseComponent {
  /**
   * Gets an array of checkbox options
   */
  private checkbox_options: GenericCheckboxComponent[] = [
    {
      label_text_key: I18NOptionKeys.options_reload_after_disable,
      getter_function: () => StorageService.getReloadAfterDisable(),
      setter_function: (value: boolean) => StorageService.saveReloadAfterDisable(value),
    },
    {
      label_text_key: I18NOptionKeys.options_reload_after_white_list,
      getter_function: () => StorageService.getReloadAfterWhitelist(),
      setter_function: (value: boolean) => StorageService.saveReloadAfterWhitelist(value),
    },
    {
      label_text_key: I18NOptionKeys.option_disable_feature,
      getter_function: () => StorageService.getDisableListFeature(),
      setter_function: (value: boolean) => StorageService.saveDisableListFeature(value),
    },
    {
      label_text_key: I18NOptionKeys.option_disable_update_notification,
      getter_function: () => StorageService.getDisableUpdateNotification(),
      setter_function: (value: boolean) => StorageService.saveDisableUpdateNotification(value),
    }, {
      label_text_key: I18NOptionKeys.option_disable_context_menu,
      getter_function: () => StorageService.getDisableContextMenu(),
      setter_function: (value: boolean) => {
        MessageBusService.sendContextMenuSwitchMessage(value);
        StorageService.saveDisableContextMenu(value);
      },
    },
  ];

  private get isFirefox(): boolean {
    return typeof browser !== 'undefined';
  }

  private openHotKeySettings(): void {
    // eslint-disable-next-line no-undef
    chrome.tabs.create({
      url: 'chrome://extensions/shortcuts',
    });
  }
}

/**
 * Interface that represents a checkbox option in the settings
 */
interface GenericCheckboxComponent {
  label_text_key: I18NOptionKeys,
  getter_function: () => Promise<boolean | undefined> | Promise<boolean>,
  setter_function: (value: boolean) => void
}
</script>
