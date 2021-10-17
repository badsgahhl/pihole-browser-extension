<template>
  <div>
    <h2 class="pb-3 mt-0">
      {{ translate(I18NOptionKeys.options_about) }}
    </h2>
    <OptionAboutExtension class="mb-5" />
    <OptionAboutReportIssue />
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api'
import OptionAboutExtension from './OptionAboutExtension.vue'
import OptionAboutReportIssue from './OptionAboutReportIssue.vue'
import useTranslation from '../../../../hooks/translation'

export default defineComponent({
  name: 'OptionAboutTab',
  components: {
    OptionAboutReportIssue,
    OptionAboutExtension
  },
  setup: () => ({ ...useTranslation() })
})
</script>
