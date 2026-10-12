<template>
  <div class="grid grid-cols-[2fr_1fr_1fr] gap-1">
    <Button variant="default" size="xs" :disabled="disabled" @click="emit('resume')">
      <PowerIcon class="size-3" />
      {{ t('popup.blocking.enableNow') }}
    </Button>
    <Button
      variant="secondary"
      size="xs"
      class="px-0 font-mono"
      :disabled="disabled || !canExtend"
      @click="emit('extend', 300)"
    >
      {{ t('popup.blocking.extend5') }}
    </Button>
    <Button
      variant="secondary"
      size="xs"
      class="px-0 font-mono"
      :disabled="disabled || !canExtend"
      @click="emit('extend', 3600)"
    >
      {{ t('popup.blocking.extend1h') }}
    </Button>
  </div>
</template>

<script setup lang="ts">
import { PowerIcon } from '@lucide/vue'

import { i18n } from '#i18n'
import { Button } from '@/components/ui/button'

defineProps<{ disabled?: boolean; canExtend?: boolean }>()

const emit = defineEmits<{ resume: []; extend: [seconds: number] }>()

const t = i18n.t
</script>
