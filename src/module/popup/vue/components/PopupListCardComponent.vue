<template>
  <v-card>
    <v-card-title>
      {{ translate(I18NPopupKeys.popup_second_card_current_url) }}
    </v-card-title>
    <v-card-text class="text-center">
      {{ currentUrl }}
    </v-card-text>
    <v-card-actions class="justify-center">
      <v-btn
        id="list_action_white"
        :disabled="buttonsDisabled"
        :title="translate(I18NPopupKeys.popup_second_card_whitelist)"
        size="sm"
        color="green"
        :loading="whitelistingActive"
        @click="whitelistUrl"
      >
        <v-icon color="white">{{ mdiCheckCircleOutline }}</v-icon>
      </v-btn>
      <v-btn
        id="list_action_black"
        :disabled="buttonsDisabled"
        :title="translate(I18NPopupKeys.popup_second_card_blacklist)"
        size="sm"
        color="red"
        :loading="blacklistingActive"
        @click="blackListUrl"
      >
        <v-icon color="white">{{ mdiAlphaXCircleOutline }}</v-icon>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { mdiAlphaXCircleOutline, mdiCheckCircleOutline } from '@mdi/js'
import { defineComponent, ref } from '@vue/composition-api'
import PiHoleApiService from '../../../../service/PiHoleApiService'
import ApiList from '../../../../api/enum/ApiList'
import useTranslation from '../../../../hooks/translation'

export default defineComponent({
  name: 'PopupListCardComponent',
  props: {
    currentUrl: {
      type: String,
      required: true
    }
  },
  setup: ({ currentUrl }) => {
    const buttonsDisabled = ref(false)
    const whitelistingActive = ref(false)
    const blacklistingActive = ref(false)

    const listDomain = async (mode: ApiList) => {
      if (!currentUrl) {
        return
      }

      buttonsDisabled.value = true

      if (mode === ApiList.whitelist) {
        whitelistingActive.value = true
      } else {
        blacklistingActive.value = true
      }

      // We remove the domain from the opposite list
      await PiHoleApiService.subDomainFromList(
        mode === ApiList.whitelist ? ApiList.blacklist : ApiList.whitelist,
        currentUrl
      )

      await PiHoleApiService.addDomainToList(mode, currentUrl)

      setTimeout(() => {
        whitelistingActive.value = false
        blacklistingActive.value = false
        buttonsDisabled.value = false
      }, 1500)
    }

    const whitelistUrl = () => {
      listDomain(ApiList.whitelist)
    }

    const blackListUrl = () => {
      listDomain(ApiList.blacklist)
    }

    return {
      whitelistingActive,
      blacklistingActive,
      buttonsDisabled,
      mdiCheckCircleOutline,
      mdiAlphaXCircleOutline,
      whitelistUrl,
      blackListUrl,
      ...useTranslation()
    }
  }
})
</script>
