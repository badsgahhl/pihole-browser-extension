<template>
  <div class="flex flex-col gap-[5px]">
    <label :for="forId" class="text-ink-2 text-xs font-medium">{{ label }}</label>
    <slot />
    <p v-if="error" :id="`${forId}-error`" role="alert" class="text-destructive text-[11px]">{{ error }}</p>
    <p v-else-if="hint" :id="`${forId}-hint`" class="text-ink-4 text-[11px]">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ label: string; forId: string; hint?: string; error?: string | null }>(), {
  hint: '',
  error: null
})
</script>
