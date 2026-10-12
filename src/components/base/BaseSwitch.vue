<template>
  <button
    type="button"
    role="switch"
    :aria-checked="model"
    :aria-label="label"
    :disabled="disabled"
    :class="
      cn(
        'focus-visible:ring-ring focus-visible:ring-offset-background relative shrink-0 cursor-pointer rounded-sm border p-0 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
        size === 'md' ? 'h-[22px] w-10' : 'h-5 w-9',
        model ? 'border-switch-on-border bg-switch-on' : 'border-border-strong bg-surface-3'
      )
    "
    @click="model = !model"
  >
    <span
      :class="
        cn(
          'absolute top-0.5 rounded-[2px] transition-[left,right]',
          size === 'md' ? 'size-4' : 'size-3.5',
          model ? 'bg-background right-0.5' : 'bg-muted-foreground left-0.5'
        )
      "
    />
  </button>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils'

withDefaults(defineProps<{ label: string; size?: 'sm' | 'md'; disabled?: boolean }>(), { size: 'md' })
const model = defineModel<boolean>({ required: true })
</script>
