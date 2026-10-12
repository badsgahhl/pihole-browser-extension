<template>
  <main class="flex w-[320px] flex-col gap-2 p-3">
    <h1 class="text-sm font-semibold">{{ title }}</h1>
    <p class="text-muted-foreground text-xs">{{ description }}</p>
  </main>
</template>

<script setup lang="ts">
import { i18n } from '#i18n'

const title = i18n.t('popup.title')
const description = i18n.t('extDescription')
</script>
