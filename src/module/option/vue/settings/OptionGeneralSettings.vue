<template>
  <b-card-text>
    <h2 class="pb-3 mt-0">{{ translate(i18nOptionsKeys.options_settings) }}</h2>
    <b-card class="shadow" no-body>
      <b-card-header class="h6">👉🏼 {{ translate(i18nOptionsKeys.options_headline_info) }}</b-card-header>
      <b-card-body>
        <OptionTabComponent></OptionTabComponent>

        <OptionDisableTimeComponent></OptionDisableTimeComponent>

        <OptionGenericCheckboxComponent v-for="item in checkbox_options" v-bind:key="item.key"
                                        :getter_function="item.getter_function"
                                        :label_text_key="item.label_text_key"
                                        :setter_function="item.setter_function"/>
      </b-card-body>
    </b-card>
  </b-card-text>
</template>

<script lang="ts">
import {Component} from "vue-property-decorator";
import {i18nOptionsKeys} from "../../../../service/I18nService";
import OptionDisableTimeComponent from "./OptionDisableTimeComponent.vue";
import OptionTabComponent from "./OptionTabComponent.vue";
import OptionGenericCheckboxComponent from "./OptionGenericCheckboxComponent.vue";
import BaseComponent from "../../../general/BaseComponent.vue";
import {StorageService} from "../../../../service/StorageService";

@Component({
  components: {
    OptionDisableTimeComponent, OptionTabComponent, OptionGenericCheckboxComponent
  }
})
export default class OptionGeneralSettings extends BaseComponent {
  /**
   * Gets an array of checkbox options
   */
  private checkbox_options: GenericCheckboxComponent[] = [
    {
      label_text_key: i18nOptionsKeys.options_reload_after_disable,
      getter_function: () => StorageService.getReloadAfterDisable(),
      setter_function: (value: boolean) => StorageService.saveReloadAfterDisable(value)
    },
    {
      label_text_key: i18nOptionsKeys.options_reload_after_white_list,
      getter_function: () => StorageService.getReloadAfterWhitelist(),
      setter_function: (value: boolean) => StorageService.saveReloadAfterWhitelist(value)
    },
    {
      label_text_key: i18nOptionsKeys.option_disable_feature,
      getter_function: () => StorageService.getDisableListFeature(),
      setter_function: (value: boolean) => StorageService.saveDisableListFeature(value)
    },
    {
      label_text_key: i18nOptionsKeys.option_disable_update_notification,
      getter_function: () => StorageService.getDisableUpdateNotification(),
      setter_function: (value: boolean) => StorageService.saveDisableUpdateNotification(value)
    }
  ];
}

/**
 * Interface that represents a checkbox option in the settings
 */
interface GenericCheckboxComponent {
  label_text_key: i18nOptionsKeys,
  getter_function: () => Promise<boolean | undefined>,
  setter_function: (value: boolean) => void
}
</script>
