<template>
  <v-card>
    <v-card-title>
      💥 {{ translate(I18NOptionKeys.options_report_error) }}
    </v-card-title>
    <v-card-text>
      <v-btn class="mb-1" @click="openGithubReport">
        {{ translate(I18NOptionKeys.option_report_error_github) }}
      </v-btn>
      <p>{{ translate(I18NOptionKeys.option_about_copy_debug) }}</p>
      <p ref="versionInfoElement">
        Switch for PiHole: {{ extensionVersion }} <br />Operating System:
        {{ plattform }} <br />Browser: {{ browser }}
      </p>
      <v-btn @click="copyToClipboard">
        <v-icon>
          mdi-content-copy
        </v-icon>
      </v-btn>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from '@vue/composition-api'
import useTranslation from '../../../../hooks/translation'

export default defineComponent({
  name: 'OptionAboutReportIssue',
  setup: () => {
    const versionInfoElement = ref<HTMLElement | null>(null)

    const { LinkConfig, translate, I18NOptionKeys } = useTranslation()
    const openGithubReport = () => {
      window.open(LinkConfig.github_issue, '_blank')
    }

    const plattform = computed(() => window.navigator.platform)
    const extensionVersion = computed(
      // eslint-disable-next-line no-undef
      () => chrome.runtime.getManifest().version
    )
    const browser = computed(() => {
      if (navigator.userAgent.indexOf('Firefox') > -1) {
        return `Mozilla Firefox ${navigator.userAgent.substr(
          navigator.userAgent.lastIndexOf('/') + 1
        )}`
      }
      if (navigator.userAgent.indexOf('Edg') > -1) {
        let startPos = navigator.userAgent.indexOf('Edg')
        startPos = navigator.userAgent.indexOf('/', startPos) + 1
        const version = navigator.userAgent.substring(startPos)
        return `Microsoft Edge ${version}`
      }
      if (navigator.userAgent.indexOf('Chrome') > -1) {
        let startPos = navigator.userAgent.indexOf('Chrome')
        startPos = navigator.userAgent.indexOf('/', startPos) + 1
        const version = navigator.userAgent.substring(
          startPos,
          navigator.userAgent.indexOf('Safari')
        )
        return `Chrome/Chromium ${version}`
      }

      return 'Other/Unknown'
    })

    const copyToClipboard = () => {
      navigator.clipboard.writeText(versionInfoElement.value!.innerText)
    }

    return {
      translate,
      I18NOptionKeys,
      browser,
      extensionVersion,
      openGithubReport,
      copyToClipboard,
      plattform,
      versionInfoElement
    }
  }
})
</script>
