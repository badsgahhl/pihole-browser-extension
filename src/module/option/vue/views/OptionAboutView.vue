<template>
  <div>
    <h1 class="mb-5">
      {{ translate(I18NOptionKeys.options_about) }}
    </h1>
    <OptionAboutExtension class="mb-5" />
    <OptionAboutReportIssue />
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api'
import useTranslation from '../../../../hooks/translation'
import OptionAboutReportIssue from '../about/OptionAboutReportIssue.vue'
import OptionAboutExtension from '../about/OptionAboutExtension.vue'

export default defineComponent({
  name: 'OptionAboutTab',
  components: {
    OptionAboutReportIssue,
    OptionAboutExtension
  },
  setup: () => ({ ...useTranslation() })
})
</script>
