<template>
  <div>
    <v-tabs v-model="current_tab_index">
      <v-tab
        v-for="(pi_hole_setting, index) in tabs"
        :key="'dyn-tab-' + index"
        @click="resetConnectionCheckAndCheck"
      >
        PiHole {{ index + 1 }}
      </v-tab>
    </v-tabs>
    <v-tabs-items v-model="current_tab_index">
      <v-tab-item
        v-for="(pi_hole_setting, index) in tabs"
        :key="index"
        class="mt-5"
      >
        <v-text-field
          v-model="pi_hole_setting.pi_uri_base"
          v-debounce:500ms="connectionCheck"
          outlined
          debounce-events="input"
          :placeholder="PiHoleSettingsDefaults.pi_uri_base"
          :rules="[
            v =>
              is_invalid_url_schema(v) ||
              translate(i18nOptionsKeys.options_url_invalid_warning)
          ]"
          :label="translate(i18nOptionsKeys.options_pi_hole_address)"
          required
        ></v-text-field>
        <v-text-field
          v-model="pi_hole_setting.api_key"
          outlined
          :type="password_input_type"
          :append-icon="
            password_input_type === 'password'
              ? 'mdi-eye-outline'
              : 'mdi-eye-off-outline'
          "
          :rules="[
            v =>
              is_invalid_api_key(v) ||
              translate(i18nOptionsKeys.options_api_key_invalid_warning)
          ]"
          :label="translate(i18nOptionsKeys.options_api_key)"
          @click:append="switch_api_key_input_type"
        ></v-text-field>

        <div class="mb-5">
          <v-btn v-if="tabs.length < 4" @click.prevent="add_new_settings_tab"
            >{{ translate(i18nOptionsKeys.options_add_button) }}
          </v-btn>
          <v-btn
            v-if="tabs.length > 1"
            @click.prevent="removeSettingsTab(current_tab_index)"
            >{{
              translate(i18nOptionsKeys.options_remove_button, [
                String(current_tab_index + 1)
              ])
            }}
          </v-btn>
        </div>
        <v-alert v-if="connectionCheckStatus === 'IDLE'" outlined type="info">
          <v-progress-circular :width="3" indeterminate />
          {{ translate(i18nOptionsKeys.option_connection_check_idle) }}
        </v-alert>
        <v-alert v-if="connectionCheckStatus === 'OK'" type="success" outlined>
          {{ translate(i18nOptionsKeys.option_connection_check_ok) }}<br />
          {{ connectionCheckVersionText }}
        </v-alert>
        <v-alert v-if="connectionCheckStatus === 'ERROR'" outlined type="error">
          {{ translate(i18nOptionsKeys.option_connection_check_error) }}
        </v-alert>
      </v-tab-item>
    </v-tabs-items>
  </div>
</template>

<script lang="ts">
import { Component, Watch } from 'vue-property-decorator'
import { debounce } from 'vue-debounce'
import {
  PiHoleSettingsStorage,
  StorageService
} from '../../../../service/StorageService'
import BaseComponent from '../../../general/BaseComponent.vue'
import { PiHoleVersions } from '../../../../api/models/PiHoleVersions'
import PiHoleApiService from '../../../../service/PiHoleApiService'

enum ConnectionCheckStatus {
  OK = 'OK',
  ERROR = 'ERROR',
  IDLE = 'IDLE'
}

@Component
export default class OptionTabComponent extends BaseComponent {
  private tabs: Array<PiHoleSettingsStorage> = [this.default_empty_option_tab()]

  private current_tab_index = 0

  private password_input_type: 'password' | 'text' = 'password'

  private connectionCheckStatus: ConnectionCheckStatus =
    ConnectionCheckStatus.IDLE

  private connectionCheckData: PiHoleVersions | null = null

  mounted() {
    this.update_tabs_settings().then(() => this.resetConnectionCheckAndCheck())
  }

  @Watch('current_tab_index', { deep: true })
  private tab_switched(): void {
    this.password_input_type = 'password'
  }

  @Watch('tabs', { deep: true })
  private on_tabs_changed(): void {
    for (const piHoleSetting of this.tabs) {
      if (typeof piHoleSetting.pi_uri_base !== 'undefined') {
        piHoleSetting.pi_uri_base = piHoleSetting.pi_uri_base.replace(
          /\s+/g,
          ''
        )
      } else {
        piHoleSetting.pi_uri_base = ''
      }
      if (typeof piHoleSetting.api_key !== 'undefined') {
        piHoleSetting.api_key = piHoleSetting.api_key.replace(/\s+/g, '')
      } else {
        piHoleSetting.api_key = ''
      }
    }
    StorageService.savePiHoleSettingsArray(this.tabs)
  }

  private get connectionCheckVersionText() {
    const data = this.connectionCheckData
    return `Core: ${data?.core_current} FTL: ${data?.FTL_current} Web: ${data?.web_current}`
  }

  private resetConnectionCheckAndCheck() {
    this.connectionCheckStatus = ConnectionCheckStatus.IDLE
    this.connectionCheckData = null
    debounce(() => {
      this.connectionCheck()
    }, '300ms')()
  }

  private connectionCheck() {
    this.connectionCheckStatus = ConnectionCheckStatus.IDLE
    PiHoleApiService.getPiHoleVersion(this.currentSelectedSettings)
      .then(result => {
        if (typeof result.data === 'object') {
          this.connectionCheckStatus = ConnectionCheckStatus.OK
          this.connectionCheckData = result.data
        } else {
          this.connectionCheckStatus = ConnectionCheckStatus.ERROR
        }
      })
      .catch(() => {
        this.connectionCheckStatus = ConnectionCheckStatus.ERROR
      })
  }

  private get currentSelectedSettings(): PiHoleSettingsStorage {
    return this.tabs[this.current_tab_index]
  }

  /**
   * Validation Function for the api key
   * @param api_key
   */
  private is_invalid_api_key(api_key: string): boolean | null {
    return !(!api_key.match('^[a-f0-9]{64}$') && api_key.length !== 0)
  }

  /**
   * Validation Function for the pi hole url
   */
  private is_invalid_url_schema(pi_hole_uri: string): boolean | null {
    console.log(pi_hole_uri)
    return !(
      !pi_hole_uri.match('^(http|https):\\/\\/[^ "]+$') ||
      pi_hole_uri.length < 1
    )
  }

  /**
   * Getter for an empty pihole settings storage
   */
  private default_empty_option_tab(): PiHoleSettingsStorage {
    return {
      pi_uri_base: '',
      api_key: ''
    }
  }

  private switch_api_key_input_type() {
    const currentState = this.password_input_type

    if (currentState === 'password') {
      this.password_input_type = 'text'
    } else {
      this.password_input_type = 'password'
    }
  }

  /**
   * Adds a new tab
   */
  private add_new_settings_tab(): void {
    this.resetConnectionCheckAndCheck()
    this.tabs.push(this.default_empty_option_tab())
    setTimeout(() => {
      this.current_tab_index = this.tabs.length - 1
    }, 0)
  }

  private removeSettingsTab(index: number): void {
    this.resetConnectionCheckAndCheck()
    this.tabs.splice(index, 1)
  }

  private async update_tabs_settings(): Promise<void> {
    const results = await StorageService.getPiHoleSettingsArray()
    if (typeof results !== 'undefined' && results.length > 0) {
      this.tabs = results
    }
  }
}
</script>
<style lang="scss" scoped>
.no-white-hover-border:hover {
  border-color: rgba(255, 255, 255, 0);
}

.no-white-hover-border:focus {
  border-color: rgba(255, 255, 255, 0);
}

.clickable {
  cursor: pointer;
}
</style>
