<template>
  <div class="text-muted-foreground flex flex-wrap items-center gap-3 text-[11.5px]" aria-hidden="true">
    <span v-for="sample in samples" :key="sample.label" class="inline-flex items-center gap-1.5">
      <!-- text-white on purpose: badge colours are the fixed values the browser paints, not theme tokens. -->
      <span
        class="inline-flex h-4 items-center justify-center rounded-[2px] px-[5px] font-mono text-[9.5px] font-bold text-white"
        :style="{ background: sample.color }"
      >
        {{ sample.text }}
      </span>
      {{ sample.label }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { i18n } from '#i18n'
import { BADGE_COLORS } from '@/lib/badge'

const t = i18n.t

/** The same colours the background paints on the toolbar icon. */
const samples = [
  { text: t('badge.on'), color: BADGE_COLORS.on, label: t('options.general.badge.active') },
  { text: '5m', color: BADGE_COLORS.paused, label: t('options.general.badge.paused') },
  { text: t('badge.error'), color: BADGE_COLORS.error, label: t('options.general.badge.unreachable') }
]
</script>
