<template>
  <v-app id="popup">
    <div class="popup-header">
      <div class="popup-header__brand">
        <img
          src="icon/icon-32.png"
          alt="Pi-hole"
          class="popup-header__logo"
        />
        <span class="popup-header__title">Pi-hole</span>
      </div>
      <v-btn
        icon
        small
        class="popup-header__settings"
        :title="translate(I18NOptionKeys.options_settings)"
        @click="openOptions"
      >
        <v-icon size="18">{{ mdiCog }}</v-icon>
      </v-btn>
    </div>

    <div class="popup-body">
      <PopupStatusCardComponent
        v-if="isActiveByBadgeLoaded"
        v-model="isActiveByRealStatus"
        :is-active-by-badge="isActiveByBadge"
      />
      <PopupListCardComponent
        v-if="isListFeatureActive"
        :current-url="currentUrl"
      />
    </div>

    <div class="popup-footer">
      Kaden's Local Build
    </div>
  </v-app>
</template>

<script lang="ts">
import { mdiCog } from '@mdi/js'
import { computed, defineComponent, onMounted, ref } from '@vue/composition-api'
import PopupStatusCardComponent from '../components/PopupStatusCardComponent.vue'
import PopupListCardComponent from '../components/PopupListCardComponent.vue'
import {
  BadgeService,
  ExtensionBadgeTextEnum
} from '../../../../service/BadgeService'
import { StorageService } from '../../../../service/StorageService'
import TabService from '../../../../service/TabService'
import useTranslation from '../../../../hooks/translation'

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
      const listFeatureDisabledByStorage =
        await StorageService.getDisableListFeature()
      if (listFeatureDisabledByStorage !== undefined) {
        listFeatureDisabled.value = listFeatureDisabledByStorage
      }
    }

    const isListFeatureActive = computed(
      () =>
        !listFeatureDisabled.value &&
        isActiveByRealStatus.value &&
        currentUrl.value.length > 0
    )

    const openOptions = () => {
      // eslint-disable-next-line no-undef
      chrome.runtime.openOptionsPage()
    }

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
      isListFeatureActive,
      mdiCog,
      openOptions,
      ...useTranslation()
    }
  }
})
</script>

<style lang="scss">
#popup {
  width: 320px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, sans-serif;
  -webkit-font-smoothing: antialiased;
}

// --- Header ---
.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 6px;

  &__brand {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__logo {
    width: 24px;
    height: 24px;
  }

  &__title {
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.2px;
  }

  &__settings {
    opacity: 0.45;
    transition: opacity 0.2s ease;

    &:hover {
      opacity: 1;
    }
  }
}

// --- Body ---
.popup-body {
  padding: 6px 12px 0;
  display: flex;
  flex-direction: column;
  gap: 10px;

  > .v-card {
    border-radius: 12px !important;
    overflow: hidden;
    transition: box-shadow 0.25s ease, border-color 0.25s ease;
  }
}

// --- Footer ---
.popup-footer {
  text-align: center;
  padding: 12px 0 14px;
  font-size: 10px;
  opacity: 0.25;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  font-weight: 500;
}

// --- Theme-aware card styles ---
.theme--dark .popup-body > .v-card {
  border: 1px solid rgba(255, 255, 255, 0.07);
}

.theme--light .popup-body > .v-card {
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06), 0 0 1px rgba(0, 0, 0, 0.04);
}

// --- Status Card ---
.status-card {
  .toggle-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 4px 0 0;
  }

  .v-input--switch {
    transform: scale(1.35);
    margin-bottom: 10px;
  }

  .status-indicator {
    display: flex;
    align-items: center;
    gap: 7px;
    transition: opacity 0.3s ease;
  }

  .status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    transition: background-color 0.3s ease, box-shadow 0.3s ease;

    &--active {
      background-color: #91dc5a;
      box-shadow: 0 0 8px rgba(145, 220, 90, 0.6);
    }

    &--inactive {
      background-color: #78909c;
    }

    &--error {
      background-color: #e91e63;
      box-shadow: 0 0 8px rgba(233, 30, 99, 0.5);
    }
  }

  .status-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    opacity: 0.6;
  }
}

// --- List Card ---
.list-card {
  &__label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    opacity: 0.4;
    margin-bottom: 10px;
  }

  .url-pill {
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 13px;
    font-weight: 500;
    text-align: center;
    word-break: break-all;
    margin-bottom: 14px;
    transition: background-color 0.2s ease, border-color 0.2s ease;
    line-height: 1.4;
  }

  &__actions {
    display: flex;
    gap: 8px;
  }

  &__btn.v-btn {
    flex: 1;
    text-transform: none !important;
    font-weight: 600 !important;
    letter-spacing: 0.2px !important;
    font-size: 12px !important;
    height: 36px !important;
  }
}

// Theme-aware URL pill
.theme--dark .list-card .url-pill {
  background: rgba(255, 80, 35, 0.1);
  border: 1px solid rgba(255, 80, 35, 0.18);
  color: #ff7a55;
}

.theme--light .list-card .url-pill {
  background: rgba(255, 80, 35, 0.06);
  border: 1px solid rgba(255, 80, 35, 0.12);
  color: #d4431e;
}
</style>
