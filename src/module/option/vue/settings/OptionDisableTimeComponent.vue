<template>
  <b-form-group :label="translate(i18nOptionsKeys.options_default_time_label)">
    <b-input-group>
      <b-input v-model:value="disable_time" min="10" type="number"></b-input>
      <b-input-group-append>
        <b-input-group-text>{{ translate(i18nOptionsKeys.options_default_time_unit) }}</b-input-group-text>
      </b-input-group-append>
    </b-input-group>
  </b-form-group>
</template>

<script lang="ts">

import {Component, Watch} from "vue-property-decorator";
import {PiHoleSettingsDefaults, StorageService} from "../../../../service/StorageService";
import BaseComponent from "../../../general/BaseComponent.vue";

@Component
/**
 * Component for the setting 'default_disable_time'
 **/
export default class OptionDisableTimeComponent extends BaseComponent {
  // Data Prop fpr the disable time
  private disable_time: number = PiHoleSettingsDefaults.default_disable_time;

  mounted() {
    this.update_disable_time();
  }

  @Watch('disable_time')
  private on_disable_time_changes(): void {
    if (this.disable_time >= 10) {
      StorageService.saveDefaultDisableTime(this.disable_time);
    }
  }

  /**
   * Function to update the disable time
   */
  private update_disable_time(): void {
    StorageService.getDefaultDisableTime().then(time => {
      if (typeof time !== "undefined") {
        this.disable_time = time;
      }
    })
  }

}
</script>

