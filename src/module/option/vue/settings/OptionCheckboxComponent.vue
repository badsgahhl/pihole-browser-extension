<template>
  <v-switch v-model="isChecked" inset :label="translate(labelTextKey)">
  </v-switch>
</template>

<script lang="ts">
import {
  defineComponent,
  onMounted,
  PropType,
  ref,
  watch
} from '@vue/composition-api'
import useTranslation from '../../../../hooks/translation'
import { I18NOptionKeys } from '../../../../service/i18NService'

export default defineComponent({
  name: 'OptionCheckboxComponent',
  props: {
    labelTextKey: {
      type: String as PropType<I18NOptionKeys>,
      required: true
    },
    getterFunction: {
      type: Function as PropType<() => Promise<boolean | undefined>>,
      required: true
    },
    setterFunction: {
      type: Function as PropType<(value: boolean) => void>,
      required: true
    }
  },
  setup: props => {
    const { translate } = useTranslation()

    const isChecked = ref(false)

    const updateStatus = () => {
      props.getterFunction().then((value?: boolean) => {
        if (typeof value === 'undefined') {
          isChecked.value = false
        } else {
          isChecked.value = value
        }
      })
    }

    onMounted(() => {
      updateStatus()
    })

    watch(isChecked, () => {
      props.setterFunction(isChecked.value)
    })
    return { translate, isChecked }
  }
})
</script>
