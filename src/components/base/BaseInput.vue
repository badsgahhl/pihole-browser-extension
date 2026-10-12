<template>
  <input
    :value="model"
    :class="
      cn(
        'border-input bg-background text-foreground placeholder:text-ink-4 focus-visible:ring-ring focus-visible:ring-offset-background aria-invalid:border-destructive box-border h-8 w-full min-w-0 rounded-sm border px-2.5 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50',
        mono && 'font-mono text-[12.5px]'
      )
    "
    @input="model = ($event.target as HTMLInputElement).value"
  />
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils'

defineProps<{ mono?: boolean }>()
const model = defineModel<string>({ required: true })
</script>
