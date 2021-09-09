<template>
  <b-card class="shadow" no-body>
    <b-card-header class="h6">
      🖥️ {{ translate(i18nOptionsKeys.option_extension) }}
    </b-card-header>
    <b-card-body>
      <p>{{ translate('manifest_description') }}</p>
      <hr class="mt-0" />
      <p>
        {{ translate(i18nOptionsKeys.option_contributors) }}
        <br />
        <b-link
          :href="LinkConfig.github_user_badsgahhl"
          class="dark-mode-light-link"
          target="_blank"
        >
          Pascal Glaser
        </b-link>
        ,
        <b-link
          :href="LinkConfig.github_user_erikr729"
          class="dark-mode-light-link"
          target="_blank"
        >
          Erik Rill
        </b-link>
      </p>
    </b-card-body>
  </b-card>
</template>

<script lang="ts">
import { Component } from 'vue-property-decorator'
import BaseComponent from '../../../general/BaseComponent.vue'

@Component
export default class OptionAboutExtension extends BaseComponent {
  // Empty Class
}
</script>
