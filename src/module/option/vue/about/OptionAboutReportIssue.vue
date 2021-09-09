<template>
  <b-card class="shadow" no-body>
    <b-card-header class="h6">
      💥 {{ translate(i18nOptionsKeys.options_report_error) }}
    </b-card-header>
    <b-card-body>
      <p>
        <b-button
          :href="LinkConfig.github_issue"
          class="text-light font-weight-bold"
          size="small"
          target="_blank"
        >
          {{ translate(i18nOptionsKeys.option_report_error_github) }}
        </b-button>
      </p>
      <p>{{ translate(i18nOptionsKeys.option_about_copy_debug) }}</p>
      <p ref="versionInfo" class="float-left">
        Switch for PiHole: {{ extension_version }} <br />Operating System:
        {{ plattform }} <br />Browser: {{ browser }}
      </p>
      <b-button
        class="btn btn btn-sm btn-primary ml-3"
        type="success"
        @click="copy_to_clipboard"
      >
        <b-icon-clipboard />
      </b-button>
    </b-card-body>
  </b-card>
</template>

<script lang="ts">
import { Component } from 'vue-property-decorator'
import BaseComponent from '../../../general/BaseComponent.vue'

@Component
export default class OptionAboutReportIssue extends BaseComponent {
  private get extension_version(): string {
    // eslint-disable-next-line no-undef
    return chrome.runtime.getManifest().version
  }

  private get plattform(): string {
    return window.navigator.platform
  }

  private get browser(): string {
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
  }

  private copy_to_clipboard(): void {
    navigator.clipboard.writeText(
      (<HTMLElement>this.$refs.versionInfo).innerText
    )
  }
}
</script>
