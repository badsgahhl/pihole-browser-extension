<template>
  <v-card>
    <v-card-title>
      🖥️ {{ translate(I18NOptionKeys.option_extension) }}
    </v-card-title>
    <v-card-text>
      <p>{{ translate('manifest_description') }}</p>
      <hr class="mt-0" />
      <p>
        {{ translate(I18NOptionKeys.option_contributors) }}
        <br />
        <a :href="LinkConfig.github_user_badsgahhl" target="_blank">
          Pascal Glaser
        </a>
        <br />
        <a :href="LinkConfig.github_user_erikr729" target="_blank">
          Erik Rill
        </a>
      </p>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api'
import useTranslation from '../../../../hooks/translation'

export default defineComponent({
  name: 'OptionAboutExtension',
  setup: () => ({ ...useTranslation() })
})
</script>
