<template>
  <!-- Same geometry as design/icons/icon-toolbar.svg, coloured with the theme tokens. -->
  <svg :width="size" :height="size" viewBox="0 0 512 512" aria-hidden="true" class="shrink-0">
    <g class="fill-success">
      <path d="M256 128c-12-48-64-74-130-60 30 52 84 72 130 60z" />
      <path d="M256 128c12-48 64-74 130-60-30 52-84 72-130 60z" />
    </g>
    <g class="fill-destructive" transform="translate(256 300) rotate(45)">
      <rect x="-136" y="-136" width="70" height="70" rx="11" />
      <rect x="-52" y="-136" width="70" height="70" rx="11" />
      <rect x="32" y="-136" width="70" height="70" rx="11" />
      <rect x="-136" y="-52" width="70" height="70" rx="11" />
      <rect x="-52" y="-52" width="70" height="70" rx="11" />
      <rect x="32" y="-52" width="70" height="70" rx="11" />
      <rect x="-136" y="32" width="70" height="70" rx="11" />
      <rect x="-52" y="32" width="70" height="70" rx="11" />
      <rect x="32" y="32" width="70" height="70" rx="11" />
    </g>
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 18 })
</script>
