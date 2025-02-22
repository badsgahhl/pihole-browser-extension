<template>
  <v-app id="popup">
    <v-container fluid>
      <PopupStatusCardComponent
        v-if="isActiveByBadgeLoaded"
        v-model="isActiveByRealStatus"
        :is-active-by-badge="isActiveByBadge"
        class="mb-5"
      />
      <PopupListCardComponent
        v-if="isListFeatureActive"
        :current-url="currentUrl"
        class="mb-5"
      />
    </v-container>
  </v-app>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from '@vue/composition-api'
import PopupStatusCardComponent from '../components/PopupStatusCardComponent.vue'
import PopupListCardComponent from '../components/PopupListCardComponent.vue'
import {
  BadgeService,
  ExtensionBadgeTextEnum
} from '../../../../service/BadgeService'
import { StorageService } from '../../../../service/StorageService'
import TabService from '../../../../service/TabService'

export default defineComponent({
  name: 'PopupComponent',
  components: {
    PopupListCardComponent,
    PopupStatusCardComponent
  },
  setup: () => {
    const isActiveByBadge = ref(false)
    const isActiveByBadgeLoaded = ref(false)
    const isActiveByRealStatus = ref(false)
    const currentUrl = ref('')
    const listFeatureDisabled = ref(false)

    const updateIsActiveByBadge = async () => {
      const badgeText = await BadgeService.getBadgeText()

      isActiveByBadge.value = badgeText === ExtensionBadgeTextEnum.enabled
      isActiveByBadgeLoaded.value = true
    }

    const updateCurrentUrl = async () => {
      const currentUrlLoaded = await TabService.getCurrentTabUrlCleaned()
      if (currentUrlLoaded.length > 0) {
        currentUrl.value = currentUrlLoaded
      }
    }

    const updateListFeatureDisabled = async () => {
      const listFeatureDisabledByStorage = await StorageService.getDisableListFeature()

      if (listFeatureDisabledByStorage !== undefined) {
        listFeatureDisabled.value = listFeatureDisabledByStorage
      }
    }

    /**
     * Determines if the list feature should be shown or not
     */
    const isListFeatureActive = computed(
      () =>
        !listFeatureDisabled.value &&
        isActiveByRealStatus.value &&
        currentUrl.value.length > 0
    )

    onMounted(() => {
      updateIsActiveByBadge()
      updateCurrentUrl()
      updateListFeatureDisabled()
    })

    return {
      currentUrl,
      isActiveByBadge,
      isActiveByBadgeLoaded,
      isActiveByRealStatus,
      isListFeatureActive
    }
  }
})
</script>

<style lang="scss">
#popup {
  width: 250px;
}
</style>
