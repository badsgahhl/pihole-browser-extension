<template>
  <b-card no-body>
    <b-card-header class="status">
      {{ translate(i18nPopupKeys.popup_status_card_title) }}
      <span
        :title="translate(i18nOptionsKeys.options_settings)"
        class="settings-link"
        @click="open_options"
        >⚙</span
      >
    </b-card-header>
    <b-card-body>
      <div class="text">
        {{ translate(i18nPopupKeys.popup_status_card_info_text) }}
      </div>
      <b-input-group class="justify-content-center">
        <b-form-input
          id="time"
          v-model.number:value="default_disable_time"
          :disabled="default_disable_time_disabled"
          class="fs-16"
          min="0"
          type="number"
        />
        <b-input-group-append>
          <b-input-group-text class="time_unit fs-16">
            {{ time_unit }}
          </b-input-group-text>
        </b-input-group-append>
      </b-input-group>
    </b-card-body>
    <b-card-footer class="text-center" style="max-height: 45px;">
      <label id="switch">
        <input
          id="sliderBox"
          v-model="slider_checked"
          :disabled="slider_disabled"
          type="checkbox"
          @change="sliderClicked()"
        />
        <span class="slider justify-content-center" />
      </label>
    </b-card-footer>
  </b-card>
</template>

<script lang="ts">
import { Component, Prop } from 'vue-property-decorator'
import {
  PiHoleSettingsDefaults,
  StorageService
} from '../../../service/StorageService'
import { PiHoleApiStatus } from '../../../api/models/PiHoleApiStatus'
import BaseComponent from '../../general/BaseComponent.vue'
import {
  BadgeService,
  ExtensionBadgeTextEnum
} from '../../../service/BadgeService'
import TabService from '../../../service/TabService'
import PiHoleApiService from '../../../service/PiHoleApiService'
import PiHoleApiStatusEnum from '../../../api/enum/PiHoleApiStatusEnum'

@Component
export default class PopupStatusCardComponent extends BaseComponent {
  // Prop which is emitted to the parent. Gets updates after a pihole status check
  @Prop({ default: false })
  is_active_by_status!: boolean

  // Is the pihole active by badge text.
  @Prop({ required: true })
  is_active_by_badge!: boolean

  // Data Prop if the slider is checked
  private slider_checked: boolean = this.is_active_by_badge

  // Data Prop if slider is disabled
  private slider_disabled: boolean = !this.is_active_by_badge

  // Data Prop if disable time input is disabled
  private default_disable_time_disabled: boolean = !this.is_active_by_badge

  // Data Prop of disable time
  private default_disable_time: number =
    PiHoleSettingsDefaults.default_disable_time

  private get time_unit(): string {
    return Number(this.default_disable_time) === 0 ? '∞' : 's'
  }

  mounted() {
    this.update_default_disable_time()
    this.update_status()
  }

  /**
   * Updates the disable time with the time in the storage
   */
  private update_default_disable_time(): void {
    StorageService.getDefaultDisableTime().then(time => {
      if (typeof time !== 'undefined') {
        this.default_disable_time = time
      }
    })
  }

  /**
   * Updates the current status of the pihole
   */
  private async update_status(): Promise<void> {
    const isEnabledByBadge =
      (await BadgeService.getBadgeText()) === ExtensionBadgeTextEnum.enabled

    if (isEnabledByBadge) {
      this.slider_checked = true
      this.slider_disabled = false
      this.default_disable_time_disabled = false
    }

    PiHoleApiService.getPiHoleStatusCombined()
      .then(value => {
        this.update_components_by_data({ status: value })
      })
      .catch(() =>
        this.update_components_by_data({ status: PiHoleApiStatusEnum.error })
      )
  }

  /**
   * Updates the components depending on PiHoleApiStatus
   * @param data
   */
  private update_components_by_data(data: PiHoleApiStatus): void {
    if (data.status === PiHoleApiStatusEnum.disabled) {
      this.default_disable_time_disabled = true
      this.slider_checked = false
      this.slider_disabled = false
      BadgeService.setBadgeText(ExtensionBadgeTextEnum.disabled)
      this.$emit('update:is_active_by_status', false)
    } else if (data.status === PiHoleApiStatusEnum.enabled) {
      this.default_disable_time_disabled = false
      this.slider_disabled = false
      this.slider_checked = true
      BadgeService.setBadgeText(ExtensionBadgeTextEnum.enabled)
      this.$emit('update:is_active_by_status', true)
    } else {
      this.default_disable_time_disabled = true
      this.slider_disabled = true
      this.slider_checked = false
      BadgeService.setBadgeText(ExtensionBadgeTextEnum.error)
      this.$emit('update:is_active_by_status', false)
    }
  }

  /**
   * Slider OnClick Function
   * Enables/Disables all PiHoles
   */
  private sliderClicked(): void {
    const currentMode = this.slider_checked
      ? PiHoleApiStatusEnum.enabled
      : PiHoleApiStatusEnum.disabled

    const time: number = this.default_disable_time

    if (time >= 0) {
      PiHoleApiService.changePiHoleStatus(currentMode, time)
        .then(value => {
          for (const piHoleStatus of value) {
            if (
              piHoleStatus.data.status === PiHoleApiStatusEnum.error ||
              piHoleStatus.data.status !== currentMode
            ) {
              this.throw_console_badge_error(
                'One PiHole returned Error from its request. Please check the API Key.',
                true
              )
              return
            }
          }
          this.on_slider_click_success_handler(value[0].data)
        })
        .catch(reason => {
          this.throw_console_badge_error(reason)
        })
    } else {
      this.throw_console_badge_error(
        'Time cannot be smaller than 0. Canceling api request.',
        true
      )
    }
  }

  /**
   * Success Callback after the slider was clicked and the request was success full
   * @param data
   */
  private on_slider_click_success_handler(data: PiHoleApiStatus): void {
    this.update_components_by_data(data)
    if (data.status === PiHoleApiStatusEnum.disabled) {
      const reloadAfterDisableCallback = (is_enabled: boolean | undefined) => {
        if (typeof is_enabled !== 'undefined' && is_enabled) {
          TabService.reloadCurrentTab(1000)
        }
      }
      StorageService.getReloadAfterDisable().then(reloadAfterDisableCallback)
    }
  }

  /**
   * Function to throw a error to the console and changing the badge
   * @param error_message
   * @param refresh_status
   */
  private throw_console_badge_error(
    error_message: string,
    refresh_status: boolean = false
  ): void {
    console.warn(error_message)

    this.update_components_by_data({ status: PiHoleApiStatusEnum.error })
    if (refresh_status) {
      setTimeout(() => {
        PiHoleApiService.getPiHoleStatusCombined()
          .then(data => this.update_components_by_data({ status: data }))
          .catch(() =>
            this.update_components_by_data({
              status: PiHoleApiStatusEnum.error
            })
          )
      }, 1500)
    }
  }

  /**
   * Helper function to open the settings
   */
  private open_options(): void {
    // eslint-disable-next-line no-undef
    chrome.runtime.openOptionsPage()
  }
}
</script>

<style lang="scss" scoped>
.text {
  font-size: 13px;
  margin-bottom: 10px;
  text-align: center;
}

#switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;

  input {
    display: none;
  }
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  -webkit-transition: 0.4s;
  transition: 0.4s;
  border-radius: 15px;
}

.slider:before {
  position: absolute;
  content: '';
  border-radius: 15px;
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  -webkit-transition: 0.4s;
  transition: 0.4s;
}

input {
  + .slider {
    background-color: red;
  }
}

input:focus {
  + .slider {
    box-shadow: 0 0 1px #22b225;
  }
}

input:checked {
  + .slider {
    background-color: #22b225;
  }

  + .slider:before {
    -webkit-transform: translateX(26px);
    -ms-transform: translateX(26px);
    transform: translateX(26px);
  }
}

.time_unit {
  min-width: 40px;
}

.fs-16 {
  font-size: 16px;
}

#time {
  max-width: 80px;
  border-top-left-radius: 5px !important;
  border-bottom-left-radius: 5px !important;
}

#time:focus {
  border-color: #ced4da;
  box-shadow: unset;
  outline: none;
}

.input-group {
  margin-bottom: 10px !important;
}

.settings-link {
  margin-right: -5px;
  cursor: pointer;
}
</style>
