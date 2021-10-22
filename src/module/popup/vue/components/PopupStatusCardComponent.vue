<template>
  <v-card>
    <v-card-title class="justify-space-between">
      {{ translate(I18NPopupKeys.popup_status_card_title) }}
      <v-icon
        right
        :title="translate(I18NOptionKeys.options_settings)"
        @click="openOptions"
        >{{ mdiCog }}
      </v-icon>
    </v-card-title>
    <v-card-text>
      <v-text-field
        v-model="defaultDisableTime"
        :disabled="defaultDisableTimeDisabled"
        type="number"
        min="0"
        outlined
        :rules="[v => typeof v === 'number' || v >= 0]"
        :suffix="defaultDisableTime > 0 ? 's' : ''"
        :append-icon="timeUnitIcon"
      >
        <template #label>
          {{ translate(I18NPopupKeys.popup_status_card_info_text) }}
        </template>
      </v-text-field>
      <div class="d-flex flex justify-center">
        <v-switch
          v-model="sliderChecked"
          style="transform: scale(1.5)"
          inset
          color="green"
          :disabled="sliderDisabled"
          @change="sliderClicked()"
        ></v-switch>
      </div>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { mdiAllInclusive, mdiCog, mdiTimerOutline } from '@mdi/js'
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
import useTranslation from '../../../../hooks/translation'

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
    const defaultDisableTimeDisabled = ref(!props.isActiveByBadge)
    const defaultDisableTime = ref<number>(
      PiHoleSettingsDefaults.default_disable_time
    )

    const timeUnitIcon = computed(() =>
      defaultDisableTime.value < 1 ? mdiAllInclusive : mdiTimerOutline
    )

    const updateDefaultDisableTime = () => {
      StorageService.getDefaultDisableTime().then(time => {
        if (typeof time !== 'undefined') {
          defaultDisableTime.value = time
        }
      })
    }

    const updateComponentsByData = (data: PiHoleApiStatus) => {
      if (data.status === PiHoleApiStatusEnum.disabled) {
        defaultDisableTimeDisabled.value = true
        sliderChecked.value = false
        sliderDisabled.value = false
        BadgeService.setBadgeText(ExtensionBadgeTextEnum.disabled)
        emit('updateStatus', false)
      } else if (data.status === PiHoleApiStatusEnum.enabled) {
        defaultDisableTimeDisabled.value = false
        sliderDisabled.value = false
        sliderChecked.value = true
        BadgeService.setBadgeText(ExtensionBadgeTextEnum.enabled)
        emit('updateStatus', true)
      } else {
        defaultDisableTimeDisabled.value = true
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
        defaultDisableTimeDisabled.value = false
      }

      PiHoleApiService.getPiHoleStatusCombined()
        .then(value => {
          updateComponentsByData({ status: value })
        })
        .catch(() =>
          updateComponentsByData({ status: PiHoleApiStatusEnum.error })
        )
    }

    const onSliderClickSuccessHandler = (data: PiHoleApiStatus) => {
      updateComponentsByData(data)
      if (data.status === PiHoleApiStatusEnum.disabled) {
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

      updateComponentsByData({ status: PiHoleApiStatusEnum.error })
      if (refresh_status) {
        setTimeout(() => {
          PiHoleApiService.getPiHoleStatusCombined()
            .then(data => updateComponentsByData({ status: data }))
            .catch(() =>
              updateComponentsByData({
                status: PiHoleApiStatusEnum.error
              })
            )
        }, 1500)
      }
    }

    const openOptions = () => {
      // eslint-disable-next-line no-undef
      chrome.runtime.openOptionsPage()
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
                piHoleStatus.data.status === PiHoleApiStatusEnum.error ||
                piHoleStatus.data.status !== currentMode
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
      defaultDisableTime,
      defaultDisableTimeDisabled,
      sliderChecked,
      sliderDisabled,
      timeUnitIcon,
      mdiCog,
      sliderClicked,
      openOptions,
      ...useTranslation()
    }
  }
})
</script>
