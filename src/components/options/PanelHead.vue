<template>
  <div class="border-border flex items-center justify-between border-b px-3.5 py-2.5">
    <span class="text-muted-foreground text-[10px] font-semibold tracking-[0.06em] uppercase"><slot /></span>
    <slot name="right" />
  </div>
</template>

<script setup lang="ts"></script>
