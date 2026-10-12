<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" aria-hidden="true" class="shrink-0">
    <path d="M12 5.5c-1.5-2.5-4-2.5-5.5-1.5 1.5 2 3.5 2.5 5.5 1.5z" class="fill-success" />
    <path d="M12 5.5c1.5-2.5 4-2.5 5.5-1.5-1.5 2-3.5 2.5-5.5 1.5z" class="fill-success" />
    <g class="fill-destructive">
      <circle cx="12" cy="9" r="3.1" />
      <circle cx="8.4" cy="12.6" r="3.1" />
      <circle cx="15.6" cy="12.6" r="3.1" />
      <circle cx="9.9" cy="16.6" r="3.1" />
      <circle cx="14.1" cy="16.6" r="3.1" />
      <circle cx="12" cy="20.2" r="2.5" />
    </g>
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 18 })
</script>
