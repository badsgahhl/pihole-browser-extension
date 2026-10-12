<template>
  <RadioGroupRoot
    :model-value="modelValue"
    :aria-label="label"
    orientation="horizontal"
    loop
    class="border-border bg-card grid overflow-hidden rounded-sm border"
    :style="{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }"
    @update:model-value="onChange"
  >
    <RadioGroupItem
      v-for="option in options"
      :key="option.value"
      :value="option.value"
      :class="
        cn(
          'border-border text-ink-2 focus-visible:ring-ring data-[state=checked]:bg-surface-3 data-[state=checked]:text-foreground cursor-pointer border-l font-medium outline-none first:border-l-0 focus-visible:ring-2 focus-visible:ring-inset data-[state=checked]:font-semibold',
          size === 'md' ? 'h-[30px] text-xs' : 'h-7 text-[11.5px]'
        )
      "
    >
      {{ option.label }}
    </RadioGroupItem>
  </RadioGroupRoot>
</template>

<script setup lang="ts" generic="T extends string">
import { RadioGroupItem, RadioGroupRoot } from 'reka-ui'

import { cn } from '@/lib/utils'

export interface SegmentOption<V extends string> {
  value: V
  label: string
}

withDefaults(defineProps<{ modelValue: T; options: SegmentOption<T>[]; label: string; size?: 'sm' | 'md' }>(), {
  size: 'md'
})

const emit = defineEmits<{ 'update:modelValue': [value: T] }>()

function onChange(value: unknown) {
  if (typeof value === 'string') emit('update:modelValue', value as T)
}
</script>
