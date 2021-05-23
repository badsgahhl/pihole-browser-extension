<template>
  <b-alert
      v-if="updatesAvailable"
      class="popup-update-alert"
      show
      variant="danger"
  >
    {{
      translate(i18nPopupKeys.popup_update_card_info, [
        updatesAvailableAmount,
        amountOfPiHoles
      ])
    }}
  </b-alert>
</template>

<script lang="ts">

import {Component} from 'vue-property-decorator';
import BaseComponent from '../../general/BaseComponent.vue';
import {StorageService} from '../../../service/StorageService';
import PiHoleApiService from '../../../service/PiHoleApiService';

@Component
export default class PopupUpdateAlertComponent extends BaseComponent {
  // Data Prop: Is an update needed?
  private updatesAvailable: boolean = false;

  // Data Prop: How many Updates are available
  private updatesAvailableAmount: number = 0;

  // Data Prop: How many PiHoles does the user use
  private amountOfPiHoles: number = 0;

  mounted() {
    this.checkForUpdates();
  }

  /**
   * Checks the pihole(s) for updates
   * Activates the alert if an update is available
   */
  private checkForUpdates(): void {
    StorageService.getDisableUpdateNotification().then((state: boolean | undefined) => {
      let isDisabled = state;
      if (typeof isDisabled !== 'undefined') {
        isDisabled = false;
      }
      if (!isDisabled) {
        PiHoleApiService.getPiHoleVersions().then((data) => {
          let updatesAvailable = false;
          let amountAvailable = 0;
          for (const response of data) {
            const responseData = response.data;
            if (responseData.core_update || responseData.web_update || responseData.FTL_update) {
              updatesAvailable = true;
              amountAvailable++;
            }
          }
          if (updatesAvailable) {
            this.updatesAvailable = updatesAvailable;
            this.updatesAvailableAmount = amountAvailable;
            this.amountOfPiHoles = data.length;
          }
        });
      }
    });
  }
}
</script>

<style lang="scss" scoped>
.popup-update-alert {
  padding: 0 !important;
  font-size: 14px;
  margin-top: 5px;
  font-weight: bold;
  margin-bottom: 0 !important;
  text-align: center;
}
</style>
