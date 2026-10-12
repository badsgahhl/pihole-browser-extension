<template>
  <main class="mx-auto flex max-w-[880px] flex-col gap-4 px-8 py-7">
    <h1 class="text-xl font-semibold tracking-[-0.02em]">{{ title }}</h1>
  </main>
</template>

<script setup lang="ts">
import { i18n } from '#i18n'

const title = i18n.t('options.title', ['Settings'])
</script>
