<template>
  <div class="grid grid-cols-7 gap-1">
    <Button
      v-for="(preset, index) in PAUSE_PRESETS"
      :key="preset"
      variant="secondary"
      size="xs"
      class="px-0 font-mono"
      :disabled="disabled"
      :aria-label="preset === 0 ? t('popup.blocking.permanent') : undefined"
      :aria-keyshortcuts="String(index + 1)"
      @click="emit('pick', preset === 0 ? null : preset)"
    >
      {{ formatDuration(preset) }}
    </Button>
    <PauseCustomPopover :disabled="disabled" @pick="emit('pick', $event)" />
  </div>
</template>

<script setup lang="ts">
import { i18n } from '#i18n'
import { Button } from '@/components/ui/button'
import { formatDuration, PAUSE_PRESETS } from '@/lib/duration'

import PauseCustomPopover from './PauseCustomPopover.vue'

defineProps<{ disabled?: boolean }>()

const emit = defineEmits<{ pick: [seconds: number | null] }>()

const t = i18n.t
</script>
