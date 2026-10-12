<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button variant="secondary" size="xs" class="px-0" :disabled="disabled" :aria-label="t('popup.blocking.custom')">
        <EllipsisIcon class="size-3.5" />
      </Button>
    </PopoverTrigger>
    <PopoverContent align="end" class="w-56 p-3">
      <form class="flex flex-col gap-2" @submit.prevent="submit">
        <span class="text-muted-foreground text-[10px] font-semibold tracking-[0.06em] uppercase">
          {{ t('popup.blocking.custom') }}
        </span>
        <NumberUnitInput id="pause-custom" v-model="seconds" :label="t('popup.blocking.custom')" />
        <Button type="submit" variant="default" size="xs" class="self-end">{{
          t('popup.blocking.customPause')
        }}</Button>
      </form>
    </PopoverContent>
  </Popover>
</template>

<script setup lang="ts">
import { EllipsisIcon } from '@lucide/vue'
import { ref } from 'vue'

import { i18n } from '#i18n'
import NumberUnitInput from '@/components/base/NumberUnitInput.vue'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

defineProps<{ disabled?: boolean }>()

const emit = defineEmits<{ pick: [seconds: number] }>()

const t = i18n.t
const open = ref(false)
const seconds = ref(600)

function submit() {
  if (seconds.value < 1) return
  open.value = false
  emit('pick', seconds.value)
}
</script>
