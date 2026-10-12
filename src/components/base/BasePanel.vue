<template>
  <section
    :aria-label="label"
    :class="cn('bg-card rounded-sm border', tone === 'warning' ? 'border-warning-border' : 'border-border')"
  >
    <slot />
  </section>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils'

withDefaults(defineProps<{ label: string; tone?: 'default' | 'warning' }>(), { tone: 'default' })
</script>
