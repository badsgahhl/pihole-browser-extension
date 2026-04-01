<template>
  <v-card class="status-card" flat>
    <v-card-text class="pa-4">
      <div class="toggle-area">
        <v-switch
          v-model="sliderChecked"
          inset
          color="secondary"
          hide-details
          :disabled="sliderDisabled"
          class="mt-0 pt-0"
          @change="sliderClicked()"
        ></v-switch>
        <div class="status-indicator">
          <span class="status-dot" :class="statusDotClass"></span>
          <span class="status-label">{{ statusText }}</span>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from '@vue/composition-api'
import {
  PiHoleSettingsDefaults,
  StorageService
} from '../../../../service/StorageService'
import { PiHoleApiStatus } from '../../../../api/models/PiHoleApiStatus'
import {
  BadgeService,
  ExtensionBadgeTextEnum
} from '../../../../service/BadgeService'
import TabService from '../../../../service/TabService'
import PiHoleApiService from '../../../../service/PiHoleApiService'
import PiHoleApiStatusEnum from '../../../../api/enum/PiHoleApiStatusEnum'

export default defineComponent({
  name: 'PopupStatusCardComponent',
  model: { prop: 'isActiveByStatus', event: 'updateStatus' },
  props: {
    isActiveByStatus: {
      type: Boolean,
      required: true
    },
    isActiveByBadge: {
      type: Boolean,
      required: true
    }
  },
  setup: (props, { emit }) => {
    const sliderChecked = ref(props.isActiveByBadge)
    const sliderDisabled = ref(!props.isActiveByBadge)
    /** Seconds for temporary disable; loaded from options storage (not shown in popup). */
    const defaultDisableTime = ref<number>(
      PiHoleSettingsDefaults.default_disable_time
    )

    const statusDotClass = computed(() => {
      if (sliderDisabled.value) return 'status-dot--error'
      return sliderChecked.value
        ? 'status-dot--active'
        : 'status-dot--inactive'
    })

    const statusText = computed(() => {
      if (sliderDisabled.value) return 'Error'
      return sliderChecked.value ? 'Enabled' : 'Disabled'
    })

    const updateDefaultDisableTime = () => {
      StorageService.getDefaultDisableTime().then(time => {
        if (typeof time !== 'undefined') {
          defaultDisableTime.value = time
        }
      })
    }

    const updateComponentsByData = (data: PiHoleApiStatus) => {
      if (data.blocking === PiHoleApiStatusEnum.disabled) {
        sliderChecked.value = false
        sliderDisabled.value = false
        BadgeService.setBadgeText(ExtensionBadgeTextEnum.disabled)
        emit('updateStatus', false)
      } else if (data.blocking === PiHoleApiStatusEnum.enabled) {
        sliderDisabled.value = false
        sliderChecked.value = true
        BadgeService.setBadgeText(ExtensionBadgeTextEnum.enabled)
        emit('updateStatus', true)
      } else {
        sliderDisabled.value = true
        sliderChecked.value = false
        BadgeService.setBadgeText(ExtensionBadgeTextEnum.error)
        emit('updateStatus', false)
      }
    }

    const updateStatus = async () => {
      const isEnabledByBadge =
        (await BadgeService.getBadgeText()) === ExtensionBadgeTextEnum.enabled

      if (isEnabledByBadge) {
        sliderChecked.value = true
        sliderDisabled.value = false
      }

      PiHoleApiService.getPiHoleStatusCombined()
        .then(value => {
          updateComponentsByData({ blocking: value })
        })
        .catch(() =>
          updateComponentsByData({ blocking: PiHoleApiStatusEnum.error })
        )
    }

    const onSliderClickSuccessHandler = (data: PiHoleApiStatus) => {
      updateComponentsByData(data)
      if (data.blocking === PiHoleApiStatusEnum.disabled) {
        const reloadAfterDisableCallback = (
          is_enabled: boolean | undefined
        ) => {
          if (typeof is_enabled !== 'undefined' && is_enabled) {
            TabService.reloadCurrentTab(1000)
          }
        }
        StorageService.getReloadAfterDisable().then(reloadAfterDisableCallback)
      }
    }

    const throwConsoleBadgeError = (
      error_message: string,
      refresh_status: boolean = false
    ) => {
      console.warn(error_message)

      updateComponentsByData({ blocking: PiHoleApiStatusEnum.error })
      if (refresh_status) {
        setTimeout(() => {
          PiHoleApiService.getPiHoleStatusCombined()
            .then(data => updateComponentsByData({ blocking: data }))
            .catch(() =>
              updateComponentsByData({
                blocking: PiHoleApiStatusEnum.error
              })
            )
        }, 1500)
      }
    }

    const sliderClicked = () => {
      const currentMode = sliderChecked.value
        ? PiHoleApiStatusEnum.enabled
        : PiHoleApiStatusEnum.disabled

      const time: number = defaultDisableTime.value

      if (time >= 0) {
        PiHoleApiService.changePiHoleStatus(currentMode, time)
          .then(value => {
            for (const piHoleStatus of value) {
              if (
                piHoleStatus.data.blocking === PiHoleApiStatusEnum.error ||
                piHoleStatus.data.blocking !== currentMode
              ) {
                throwConsoleBadgeError(
                  'One PiHole returned Error from its request. Please check the API Key.',
                  true
                )
                return
              }
            }
            onSliderClickSuccessHandler(value[0].data)
          })
          .catch(reason => {
            throwConsoleBadgeError(reason)
          })
      } else {
        throwConsoleBadgeError(
          'Time cannot be smaller than 0. Canceling api request.',
          true
        )
      }
    }

    onMounted(() => {
      updateDefaultDisableTime()
      updateStatus()
    })

    return {
      sliderChecked,
      sliderDisabled,
      statusDotClass,
      statusText,
      sliderClicked
    }
  }
})
</script>
