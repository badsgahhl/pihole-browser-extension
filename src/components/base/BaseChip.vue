<template>
  <component
    :is="as"
    :type="as === 'button' ? 'button' : undefined"
    :class="
      cn(
        'inline-flex h-5 items-center gap-1 rounded-sm border px-[7px] text-[10.5px] font-semibold whitespace-nowrap',
        toneClass,
        as === 'button' &&
          'focus-visible:ring-ring focus-visible:ring-offset-background cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-1'
      )
    "
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { cn } from '@/lib/utils'

export type ChipTone = 'neutral' | 'success' | 'warning' | 'danger'

const props = withDefaults(defineProps<{ tone?: ChipTone; as?: 'span' | 'button' }>(), {
  tone: 'neutral',
  as: 'span'
})

const toneClass = computed(
  () =>
    ({
      neutral: 'border-border bg-muted text-muted-foreground',
      success: 'border-success-border bg-success-soft text-success',
      warning: 'border-warning-border bg-warning-soft text-warning',
      danger: 'border-danger-border bg-danger-soft text-destructive'
    })[props.tone]
)
</script>
