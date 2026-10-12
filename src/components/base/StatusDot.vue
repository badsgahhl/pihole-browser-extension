<template>
  <span aria-hidden="true" :class="cn('inline-block shrink-0 rounded-full', sizeClass, toneClass, halo && haloClass)" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { cn } from '@/lib/utils'

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

const props = withDefaults(defineProps<{ tone?: StatusTone; size?: 'sm' | 'md'; halo?: boolean }>(), {
  tone: 'neutral',
  size: 'md'
})

const sizeClass = computed(() => (props.size === 'md' ? 'size-2' : 'size-[5px]'))

const toneClass = computed(
  () =>
    ({
      success: 'bg-success',
      warning: 'bg-warning',
      danger: 'bg-destructive',
      info: 'bg-info',
      neutral: 'bg-muted-foreground'
    })[props.tone]
)

const haloClass = computed(
  () =>
    ({
      success: 'ring-[3px] ring-success/20',
      warning: 'ring-[3px] ring-warning/20',
      danger: 'ring-[3px] ring-destructive/20',
      info: 'ring-[3px] ring-info/20',
      neutral: 'ring-[3px] ring-muted-foreground/20'
    })[props.tone]
)
</script>
