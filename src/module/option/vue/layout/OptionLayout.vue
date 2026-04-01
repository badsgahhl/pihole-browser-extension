<template>
  <v-app class="options-app">
    <v-navigation-drawer
      app
      permanent
      width="280"
      class="options-drawer"
      :mini-variant="false"
    >
      <div class="options-drawer__brand">
        <v-img
          class="options-drawer__logo"
          height="40"
          width="40"
          src="icon/icon-128.png"
          contain
        />
        <div class="options-drawer__titles">
          <span class="options-drawer__name">Pi-hole</span>
          <span class="options-drawer__sub">Browser Extension</span>
        </div>
      </div>

      <v-divider class="options-drawer__divider" />

      <v-list dense nav class="options-drawer__nav">
        <v-list-item
          link
          to="/"
          class="options-drawer__item"
        >
          <v-list-item-icon class="options-drawer__icon">
            <v-icon>{{ mdiCog }}</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{
              translate(I18NOptionKeys.options_settings)
            }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item
          link
          to="/about"
          class="options-drawer__item"
        >
          <v-list-item-icon class="options-drawer__icon">
            <v-icon>{{ mdiInformationOutline }}</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{
              translate(I18NOptionKeys.options_about)
            }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-divider class="my-2" />

        <v-list-item
          link
          :href="LinkConfig.paypal_donation_link"
          target="_blank"
          class="options-drawer__item"
        >
          <v-list-item-icon class="options-drawer__icon">
            <v-icon>{{ mdiGift }}</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{
              translate(I18NOptionKeys.option_donation)
            }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item
          link
          :href="LinkConfig.github_issue"
          target="_blank"
          class="options-drawer__item"
        >
          <v-list-item-icon class="options-drawer__icon">
            <v-icon>{{ mdiFire }}</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{
              translate(I18NOptionKeys.option_troubleshooting)
            }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>

      <template #append>
        <div class="options-drawer__footer">
          {{ copyrightText }}
        </div>
      </template>
    </v-navigation-drawer>

    <v-main class="options-main">
      <v-container fluid class="options-main__inner">
        <router-view></router-view>
      </v-container>
    </v-main>
  </v-app>
</template>

<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api'
import { mdiCog, mdiFire, mdiGift, mdiInformationOutline } from '@mdi/js'
import useTranslation from '../../../../hooks/translation'

export default defineComponent({
  name: 'OptionComponent',
  setup: () => {
    const { translate, LinkConfig, I18NOptionKeys } = useTranslation()

    const copyrightText = computed(() => {
      const year = new Date().getFullYear()
      return `(C) ${year} - Pascal Glaser`
    })

    return {
      copyrightText,
      translate,
      LinkConfig,
      I18NOptionKeys,
      mdiCog,
      mdiInformationOutline,
      mdiGift,
      mdiFire
    }
  }
})
</script>

<style lang="scss">
.options-app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.options-drawer {
  border-right: 1px solid rgba(128, 128, 128, 0.12) !important;

  .v-navigation-drawer__content {
    display: flex;
    flex-direction: column;
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 24px 20px 20px;
  }

  &__logo {
    flex-shrink: 0;
    border-radius: 10px;
  }

  &__titles {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__name {
    font-size: 17px;
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.2;
  }

  &__sub {
    font-size: 11px;
    font-weight: 500;
    opacity: 0.45;
    letter-spacing: 0.02em;
  }

  &__divider {
    opacity: 0.08;
  }

  &__nav {
    padding: 12px 12px 8px !important;
  }

  &__item {
    border-radius: 10px !important;
    margin-bottom: 4px !important;
    min-height: 44px !important;

    &.v-list-item--active {
      background: rgba(145, 220, 90, 0.12) !important;

      .v-list-item__title {
        font-weight: 600 !important;
      }
    }
  }

  &__icon {
    margin-right: 12px !important;
  }

  &__footer {
    padding: 16px 20px 20px;
    font-size: 10px;
    opacity: 0.28;
    letter-spacing: 0.4px;
    text-align: center;
    line-height: 1.4;
  }
}

.theme--dark .options-drawer__item:not(.v-list-item--active):hover::before {
  opacity: 0.06;
}

.options-main {
  background: transparent !important;
}

.options-main__inner {
  max-width: 900px !important;
  padding-top: 36px !important;
  padding-bottom: 48px !important;
  padding-left: 40px !important;
  padding-right: 40px !important;
}

@media (max-width: 960px) {
  .options-main__inner {
    padding-left: 24px !important;
    padding-right: 24px !important;
  }
}
</style>
