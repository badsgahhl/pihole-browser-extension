<template>
  <div class="flex items-center justify-between">
    <span class="text-muted-foreground text-[10px] font-semibold tracking-[0.06em] uppercase"><slot /></span>
    <slot name="right" />
  </div>
</template>

<script setup lang="ts"></script>
