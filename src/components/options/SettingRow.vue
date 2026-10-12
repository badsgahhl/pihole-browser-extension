<template>
  <div class="border-border flex items-center gap-4 border-b px-3.5 py-2.5 last:border-b-0">
    <div class="min-w-0 flex-1">
      <label v-if="forId" :for="forId" class="font-medium">{{ title }}</label>
      <div v-else class="font-medium">{{ title }}</div>
      <div class="text-muted-foreground text-[11.5px]">{{ text }}</div>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ title: string; text: string; forId?: string }>(), { forId: undefined })
</script>
