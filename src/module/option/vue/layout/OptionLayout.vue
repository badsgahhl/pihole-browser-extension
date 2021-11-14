<template>
  <v-app>
    <v-navigation-drawer app>
      <v-list-item>
        <v-list-item-avatar>
          <v-img height="60px" src="icon/icon-128.png" contain />
        </v-list-item-avatar>
        <v-list-item-content>
          <v-list-item-title class="text-h6">
            PiHole
            <br />Browser <br />Extension
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-divider></v-divider>

      <v-list dense nav>
        <v-list-item link to="/">
          <v-list-item-icon>
            <v-icon>{{ mdiCog }}</v-icon>
            ️
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title
              >{{ translate(I18NOptionKeys.options_settings) }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link to="/about">
          <v-list-item-icon>
            <v-icon>{{ mdiInformationOutline }}</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title
              >{{ translate(I18NOptionKeys.options_about) }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-divider />
        <v-list-item
          link
          :href="LinkConfig.paypal_donation_link"
          target="_blank"
        >
          <v-list-item-icon>
            <v-icon>{{ mdiGift }}</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title
              >{{ translate(I18NOptionKeys.option_donation) }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link :href="LinkConfig.github_issue" target="_blank">
          <v-list-item-icon>
            <v-icon>{{ mdiFire }}</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title
              >{{ translate(I18NOptionKeys.option_troubleshooting) }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
      <template #append>
        <v-alert color="primary" outlined class="mx-5">
          {{ copyrightText }}
        </v-alert>
      </template>
    </v-navigation-drawer>
    <v-main>
      <v-container fluid style="max-width: 1440px">
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
