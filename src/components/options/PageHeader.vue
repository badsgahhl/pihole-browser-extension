<template>
  <div>
    <h1 class="text-xl font-semibold tracking-[-0.02em]">{{ title }}</h1>
    <p class="text-muted-foreground mt-1 text-[12.5px]">{{ intro }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string; intro: string }>()
</script>
