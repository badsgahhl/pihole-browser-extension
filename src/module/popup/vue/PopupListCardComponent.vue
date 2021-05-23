<template>
  <b-card no-body>
    <b-card-header
      id="list_card"
      class="status"
    >
      {{ translate(i18nPopupKeys.popup_second_card_current_url) }}
    </b-card-header>
    <b-card-body
      id="current_url"
      :class="background_classes"
      class="text-center"
    >
      {{ current_url }}
    </b-card-body>
    <b-card-footer class="text-center">
      <b-button
        id="list_action_white"
        :disabled="buttons_disabled"
        :title="translate(i18nPopupKeys.popup_second_card_whitelist)"
        size="sm"
        variant="success"
        @click="whitelist_url"
      >
        <b-icon-check-circle
          v-if="!whitelisting_active"
          style="height: 20px;width: 20px"
        />
        <b-spinner
          v-else
          style="width:20px;height: 20px"
        />
      </b-button>
      <b-button
        id="list_action_black"
        :disabled="buttons_disabled"
        :title="translate(i18nPopupKeys.popup_second_card_blacklist)"
        size="sm"
        variant="danger"
        @click="blacklist_url"
      >
        <b-icon-x-circle
          v-if="!blacklisting_active"
          style="height: 20px;width: 20px"
        />
        <b-spinner
          v-else
          style="width:20px;height: 20px"
        />
      </b-button>
    </b-card-footer>
  </b-card>
</template>

<script lang="ts">
import { Component, Prop } from 'vue-property-decorator';
import BaseComponent from '../../general/BaseComponent.vue';
import { StorageService } from '../../../service/StorageService';
import TabService from '../../../service/TabService';
import PiHoleApiService from '../../../service/PiHoleApiService';
import ApiList from '../../../api/enum/ApiList';

@Component
export default class PopupListCardComponent extends BaseComponent {
  // Current URL passed by the parent
  @Prop({ required: true })
  current_url!: string;

  // Data prop: Are the buttons disabled?
  private buttons_disabled: boolean = false;

  // Data prop: Is the whitelisting routine running?
  private whitelisting_active: boolean = false;

  // Data prop: Is the blacklisting routine running;
  private blacklisting_active: boolean = false;

  // Data prop: Which background classes are currently used to show a status.
  private background_classes: string = '';

  /**
   * Wrapper function for the onclick button event
   */
  private whitelist_url(): void {
    this.list_domain(ApiList.whitelist);
  }

  /**
   * Wrapper function for the onclick button event
   */
  private blacklist_url(): void {
    this.list_domain(ApiList.blacklist);
  }

  /**
   * This function will add a domain to the whitelist or block list
   */
  private async list_domain(mode: ApiList): Promise<void> {
    const domain = this.current_url;

    if (!domain) {
      return;
    }

    this.buttons_disabled = true;

    if (mode === ApiList.whitelist) {
      this.whitelisting_active = true;
    } else {
      this.blacklisting_active = true;
    }

    // Delay between each call to one of multiple piholes
    const delayIncrement = 2000;
    let delay = 0;

    // We remove the domain from the opposite list
    await PiHoleApiService.subDomainFromList(mode === ApiList.whitelist
      ? ApiList.blacklist : ApiList.whitelist, domain);

    const piHoleListResults = (await PiHoleApiService.addDomainToList(mode, domain));

    piHoleListResults.forEach((response, index) => {
      setTimeout(() => {
        const responseData = response.data;
        if (responseData.success) {
          if (responseData.message.includes('Not adding')) {
            this.background_classes = 'bg-warning text-dark';
            setTimeout(() => {
              this.background_classes = '';
            }, 1500);
          } else if (responseData.message.includes('Added')) {
            this.background_classes = 'bg-success text-white';
            setTimeout(() => {
              this.background_classes = '';
            }, 1500);
          }
        } else {
          this.background_classes = 'bg-danger text-white';
          setTimeout(() => {
            this.background_classes = '';
          }, 1500);
        }

        // After the last one we enable the button again and remove the spinning circle
        if (index + 1 === piHoleListResults.length) {
          setTimeout(async () => {
            const reloadAfterWhitelist = (await StorageService.getReloadAfterWhitelist());

            if (typeof reloadAfterWhitelist !== 'undefined' && reloadAfterWhitelist && mode === ApiList.whitelist && responseData.success && responseData.message.includes('Added')) {
              TabService.reloadCurrentTab(250);
            }

            this.buttons_disabled = false;
            this.whitelisting_active = false;
            this.blacklisting_active = false;
          }, 1500);
        }
      }, delay);
      delay += delayIncrement;
    });
  }
}
</script>
<style lang="scss" scoped>
#current_url {
  -webkit-transition: background-color 500ms ease;
}
</style>
