<template>
  <span v-if="keys.length === 0" class="text-ink-4 text-xs">{{ t('common.notSet') }}</span>
  <span v-else class="inline-flex items-center gap-1">
    <template v-for="(key, index) in keys" :key="index">
      <span v-if="index > 0" class="text-ink-4 text-[10px]" aria-hidden="true">+</span>
      <kbd
        class="border-border-strong bg-secondary text-foreground inline-flex h-5 min-w-5 items-center justify-center rounded-[2px] border px-1.5 font-mono text-[10.5px] font-medium"
      >
        {{ key }}
      </kbd>
    </template>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { i18n } from '#i18n'

const props = defineProps<{ shortcut: string }>()

const t = i18n.t

/** `Ctrl+Shift+P` or `MacCtrl+Shift+P` as the browser reports it; an empty string is "not set". */
const keys = computed(() =>
  props.shortcut
    .split('+')
    .map((key) => key.trim())
    .filter(Boolean)
)
</script>
