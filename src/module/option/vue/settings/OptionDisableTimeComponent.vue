<template>
  <v-text-field
    v-model="disableTime"
    :label="translate(I18NOptionKeys.options_default_time_label)"
    type="number"
    min="10"
    outlined
    :rules="[v => typeof v === 'number' || v >= 10]"
    :suffix="translate(I18NOptionKeys.options_default_time_unit)"
  ></v-text-field>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, watch } from '@vue/composition-api'
import {
  PiHoleSettingsDefaults,
  StorageService
} from '../../../../service/StorageService'
import useTranslation from '../../../../hooks/translation'

export default defineComponent({
  name: 'OptionGenericCheckboxComponent',
  setup: () => {
    const { translate, I18NOptionKeys } = useTranslation()
    const disableTime = ref(PiHoleSettingsDefaults.default_disable_time)

    const updateDisableTime = () => {
      StorageService.getDefaultDisableTime().then(time => {
        if (typeof time !== 'undefined') {
          disableTime.value = time
        }
      })
    }

    watch(disableTime, () => {
      if (disableTime.value >= 10) {
        StorageService.saveDefaultDisableTime(Number(disableTime.value))
      }
    })

    onMounted(() => updateDisableTime())

    return { translate, I18NOptionKeys, disableTime, console }
  }
})
</script>
