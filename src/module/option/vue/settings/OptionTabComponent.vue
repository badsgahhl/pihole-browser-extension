<template>
  <div>
    <v-tabs v-model="currentTab">
      <v-tab
        v-for="(pi_hole_setting, index) in tabs"
        :key="'dyn-tab-' + index"
        @click="resetConnectionCheckAndCheck"
      >
        PiHole {{ index + 1 }}
      </v-tab>
    </v-tabs>
    <v-tabs-items v-model="currentTab">
      <v-tab-item
        v-for="(pi_hole_setting, index) in tabs"
        :key="index"
        class="mt-5"
      >
        <v-text-field
          v-model="pi_hole_setting.pi_uri_base"
          v-debounce:500ms="connectionCheck"
          outlined
          debounce-events="input"
          :placeholder="PiHoleSettingsDefaults.pi_uri_base"
          :rules="[
            v =>
              isInvalidUrlSchema(v) ||
              translate(I18NOptionKeys.options_url_invalid_warning)
          ]"
          :label="translate(I18NOptionKeys.options_pi_hole_address)"
          required
        ></v-text-field>
        <v-text-field
          v-model="pi_hole_setting.api_key"
          v-debounce:500ms="connectionCheck"
          outlined
          :type="passwordInputType"
          :append-icon="
            passwordInputType === 'password' ? mdiEyeOutline : mdiEyeOffOutline
          "
          :label="translate(I18NOptionKeys.options_api_key)"
          @click:append="toggleApiKeyVisibility"
        ></v-text-field>

        <div class="mb-5">
          <v-btn v-if="tabs.length < 4" @click.prevent="addNewPiHole"
            >{{ translate(I18NOptionKeys.options_add_button) }}
          </v-btn>
          <v-btn
            v-if="tabs.length > 1"
            @click.prevent="removePiHole(currentTab)"
            >{{
              translate(I18NOptionKeys.options_remove_button, [
                String(currentTab + 1)
              ])
            }}
          </v-btn>
        </div>
        <v-alert v-if="tabs.length > 1" type="info" outlined>
          {{ translate(I18NOptionKeys.option_multiple_connections) }}
        </v-alert>
        <v-alert v-if="connectionCheckStatus === 'IDLE'" outlined type="info">
          {{ translate(I18NOptionKeys.option_connection_check_idle) }}
          <v-progress-circular
            color="primary"
            indeterminate
            :size="25"
            :width="2"
          />
        </v-alert>
        <v-alert v-if="connectionCheckStatus === 'OK'" type="success" outlined>
          {{ translate(I18NOptionKeys.option_connection_check_ok) }}<br />
          {{ connectionCheckVersionText }}
        </v-alert>
        <v-alert v-if="connectionCheckStatus === 'ERROR'" outlined type="error">
          {{ translate(I18NOptionKeys.option_connection_check_error) }}
        </v-alert>
        <v-alert
          v-if="
            connectionCheckStatus === 'OK' &&
              connectionCheckData !== null &&
              (connectionCheckData.core_update ||
                connectionCheckData.web_update ||
                connectionCheckData.FTL_update)
          "
          outlined
          type="info"
        >
          {{
            translate(I18NOptionKeys.option_connection_check_update_available)
          }}
        </v-alert>
      </v-tab-item>
    </v-tabs-items>
  </div>
</template>

<script lang="ts">
import { debounce } from 'vue-debounce'
import {
  computed,
  defineComponent,
  onMounted,
  ref,
  watch
} from '@vue/composition-api'
import { mdiEyeOffOutline, mdiEyeOutline } from '@mdi/js'
import {
  PiHoleSettingsStorage,
  StorageService
} from '../../../../service/StorageService'
import { PiHoleVersionsV6 } from '../../../../api/models/PiHoleVersions'
import PiHoleApiService from '../../../../service/PiHoleApiService'
import useTranslation from '../../../../hooks/translation'

enum ConnectionCheckStatus {
  OK = 'OK',
  ERROR = 'ERROR',
  IDLE = 'IDLE'
}

enum PasswordInputType {
  password = 'password',
  text = 'text'
}

export default defineComponent({
  name: 'OptionTabComponent',
  setup: () => {
    const tabs = ref<PiHoleSettingsStorage[]>([
      {
        pi_uri_base: '',
        api_key: ''
      }
    ])

    const currentTab = ref(0)

    const passwordInputType = ref<PasswordInputType>(PasswordInputType.password)

    const connectionCheckStatus = ref<ConnectionCheckStatus>(
      ConnectionCheckStatus.IDLE
    )

    const connectionCheckData = ref<PiHoleVersionsV6 | null>(null)

    const currentSelectedSettings = computed(() => tabs.value[currentTab.value])

    const connectionCheck = () => {
      connectionCheckStatus.value = ConnectionCheckStatus.IDLE
      PiHoleApiService.getPiHoleVersion(currentSelectedSettings.value)
        .then(result => {
          console.log('version', result)
          if (typeof result.data === 'object') {
            connectionCheckStatus.value = ConnectionCheckStatus.OK
            connectionCheckData.value = result.data
          } else {
            connectionCheckStatus.value = ConnectionCheckStatus.ERROR
          }
        })
        .catch(() => {
          connectionCheckStatus.value = ConnectionCheckStatus.ERROR
        })
    }
    const resetConnectionCheckAndCheck = () => {
      connectionCheckStatus.value = ConnectionCheckStatus.IDLE
      connectionCheckData.value = null
      debounce(() => {
        connectionCheck()
      }, '300ms')()
    }

    const updateTabsSettings = async () => {
      const results = await StorageService.getPiHoleSettingsArray()
      if (typeof results !== 'undefined' && results.length > 0) {
        tabs.value = results
      }
    }

    onMounted(() => {
      updateTabsSettings().then(() => resetConnectionCheckAndCheck())
    })

    watch(currentTab, () => {
      passwordInputType.value = PasswordInputType.password
    })

    watch(
      tabs,
      () => {
        for (const piHoleSetting of tabs.value) {
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
        StorageService.savePiHoleSettingsArray(tabs.value)
      },
      { deep: true }
    )

    const connectionCheckVersionText = computed(() => {
      const data = connectionCheckData.value
      return `Core: ${data?.version.core.local.version} FTL: ${data?.version.ftl.local.version} Web: ${data?.version.web.local.version}`
    })

    const toggleApiKeyVisibility = () => {
      if (passwordInputType.value === PasswordInputType.password) {
        passwordInputType.value = PasswordInputType.text
      } else {
        passwordInputType.value = PasswordInputType.password
      }
    }

    const addNewPiHole = () => {
      resetConnectionCheckAndCheck()
      tabs.value.push({ pi_uri_base: '', api_key: '' })
      setTimeout(() => {
        currentTab.value = tabs.value.length - 1
      }, 0)
    }

    const removePiHole = (index: number) => {
      resetConnectionCheckAndCheck()
      tabs.value.splice(index, 1)
    }

    const isInvalidUrlSchema = (piHoleUrl: string) =>
      !(!piHoleUrl.match('^(http|https):\\/\\/[^ "]+$') || piHoleUrl.length < 1)

    return {
      mdiEyeOutline,
      mdiEyeOffOutline,
      currentTab,
      tabs,
      passwordInputType,
      connectionCheck,
      resetConnectionCheckAndCheck,
      isInvalidUrlSchema,
      removePiHole,
      addNewPiHole,
      toggleApiKeyVisibility,
      connectionCheckVersionText,
      connectionCheckStatus,
      connectionCheckData,
      ...useTranslation()
    }
  }
})
</script>
