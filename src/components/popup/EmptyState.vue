<template>
  <div
    class="border-border bg-card mx-2.5 mt-2.5 flex flex-col items-center gap-2 rounded-sm border px-4 py-6 text-center"
  >
    <BrandMark :size="28" />
    <div class="font-semibold">{{ t('popup.empty.title') }}</div>
    <p class="text-muted-foreground text-[11.5px]">{{ t('popup.empty.text') }}</p>
    <Button variant="default" size="sm" class="mt-1" @click="emit('add')">{{ t('popup.empty.action') }}</Button>
  </div>
</template>

<script setup lang="ts">
import { i18n } from '#i18n'
import BrandMark from '@/components/base/BrandMark.vue'
import { Button } from '@/components/ui/button'

const emit = defineEmits<{ add: [] }>()

const t = i18n.t
</script>
