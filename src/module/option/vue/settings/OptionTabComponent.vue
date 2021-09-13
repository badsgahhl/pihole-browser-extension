<template>
  <b-tabs v-model="current_tab_index">
    <b-tab
      v-for="(pi_hole_setting, index) in tabs"
      :key="'dyn-tab-' + index"
      :title="'PiHole ' + (index + 1)"
      @click="resetConnectionCheckAndCheck"
    >
      <b-form-group
        :label="translate(i18nOptionsKeys.options_pi_hole_address)"
        style="margin-top: 1rem"
      >
        <b-form-input
          v-model="pi_hole_setting.pi_uri_base"
          v-debounce:500ms="connectionCheck"
          debounce-events="input"
          :placeholder="PiHoleSettingsDefaults.pi_uri_base"
          :state="is_invalid_url_schema(pi_hole_setting.pi_uri_base)"
          required
        />
        <b-form-valid-feedback :force-show="connectionCheckStatus === 'IDLE'">
          <b-spinner small />
          {{ translate(i18nOptionsKeys.option_connection_check_idle) }}
        </b-form-valid-feedback>
        <b-form-valid-feedback :force-show="connectionCheckStatus === 'OK'">
          {{ translate(i18nOptionsKeys.option_connection_check_ok) }}<br />
          {{ connectionCheckVersionText }}
        </b-form-valid-feedback>
        <b-form-invalid-feedback
          :force-show="connectionCheckStatus === 'ERROR'"
        >
          {{ translate(i18nOptionsKeys.option_connection_check_error) }}
        </b-form-invalid-feedback>
        <b-form-invalid-feedback
          :state="is_invalid_url_schema(pi_hole_setting.pi_uri_base)"
        >
          {{ translate(i18nOptionsKeys.options_url_invalid_warning) }}
        </b-form-invalid-feedback>
      </b-form-group>
      <b-form-group :label="translate(i18nOptionsKeys.options_api_key)">
        <b-input-group>
          <b-form-input
            v-model="pi_hole_setting.api_key"
            :state="is_invalid_api_key(pi_hole_setting.api_key)"
            :type="password_input_type"
          />
          <b-input-group-append class="clickable">
            <b-input-group-text @click="switch_api_key_input_type">
              <b-icon-eye v-if="password_input_type === 'password'" />
              <b-icon-eye-slash v-else />
            </b-input-group-text>
          </b-input-group-append>
        </b-input-group>
        <b-form-invalid-feedback
          :state="is_invalid_api_key(pi_hole_setting.api_key)"
        >
          {{ translate(i18nOptionsKeys.options_api_key_invalid_warning) }}
        </b-form-invalid-feedback>
      </b-form-group>
    </b-tab>

    <!-- New Tab Button (Using tabs-end slot) -->
    <template #tabs-end style="font-size: 20px;">
      <b-nav-item
        v-if="tabs.length < 4"
        :title="translate(i18nOptionsKeys.options_add_button)"
        href="#"
        link-classes="no-white-hover-border"
        role="presentation"
        @click.prevent="add_new_settings_tab"
      >
        <b-icon-plus-circle
          style="width: 20px;height: 20px"
          variant="success"
        />
      </b-nav-item>
      <b-nav-item
        v-if="tabs.length > 1"
        :title="translate(i18nOptionsKeys.options_remove_button)"
        href="#"
        link-classes="no-white-hover-border"
        role="presentation"
        @click.prevent="remove_last_settings_tab"
      >
        <b-icon-x-circle style="width: 20px;height: 20px" variant="danger" />
      </b-nav-item>
    </template>
  </b-tabs>
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
  private tab_switched(newValue: number, oldValue: number): void {
    if (newValue === oldValue) {
      return
    }
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
    return !api_key.match('^[a-f0-9]{64}$') && api_key.length !== 0
      ? false
      : null
  }

  /**
   * Validation Function for the pi hole url
   */
  private is_invalid_url_schema(pi_hole_uri: string): boolean | null {
    return !pi_hole_uri.match('^(http|https):\\/\\/[^ "]+$') ||
      pi_hole_uri.length < 1
      ? false
      : null
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
    this.tabs.push(this.default_empty_option_tab())
    setTimeout(() => {
      this.current_tab_index = this.tabs.length - 1
    }, 0)
  }

  /**
   * Removes the last tab
   */
  private remove_last_settings_tab(): void {
    this.tabs.pop()
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
