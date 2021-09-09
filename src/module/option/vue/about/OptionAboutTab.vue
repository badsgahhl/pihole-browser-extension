<template>
  <b-card-text>
    <h2 class="pb-3 mt-0">
      {{ translate(i18nOptionsKeys.options_about) }}
    </h2>
    <OptionAboutExtension />
    <OptionAboutReportIssue />
    <OptionAboutLicenses />
  </b-card-text>
</template>

<script lang="ts">
import { Component } from 'vue-property-decorator'
import OptionAboutLicenses from './OptionAboutLicenses.vue'
import OptionAboutExtension from './OptionAboutExtension.vue'
import OptionAboutReportIssue from './OptionAboutReportIssue.vue'
import BaseComponent from '../../../general/BaseComponent.vue'

@Component({
  components: {
    OptionAboutReportIssue,
    OptionAboutExtension,
    OptionAboutLicenses
  }
})
export default class OptionAboutTab extends BaseComponent {
  // Empty class
}
</script>

<style lang="scss" scoped>
.card {
  margin-bottom: 2rem;
}
</style>
