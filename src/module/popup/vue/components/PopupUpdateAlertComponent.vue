<template>
  <v-alert v-if="updatesAvailable" type="info">
    {{ translate(i18nPopupKeys.popup_update_card_info) }}
  </v-alert>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from '@vue/composition-api'
import { StorageService } from '../../../../service/StorageService'
import PiHoleApiService from '../../../../service/PiHoleApiService'
import useTranslation from '../../../../hooks/translation'

export default defineComponent({
  name: 'PopupUpdateAlertComponent',
  setup: () => {
    const updatesAvailable = ref(false)

    const checkForUpdates = async () => {
      const isUpdateNotificationDisabled = await StorageService.getDisableUpdateNotification()

      if (
        isUpdateNotificationDisabled === undefined ||
        isUpdateNotificationDisabled
      ) {
        return
      }

      updatesAvailable.value =
        (await PiHoleApiService.getPiHoleVersions()).filter(
          ({ data }) => data.core_update || data.web_update || data.FTL_update
        ).length > 0
    }

    onMounted(() => checkForUpdates)

    return { updatesAvailable, ...useTranslation() }
  }
})
</script>
