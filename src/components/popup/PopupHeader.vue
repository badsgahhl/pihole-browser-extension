<template>
  <header class="border-border flex h-11 shrink-0 items-center gap-2 border-b pr-2 pl-3">
    <BrandMark :size="18" />
    <!-- From two Pi-holes on, the chips need the title's room; screen readers still get the heading. -->
    <h1 class="shrink-0 text-[13px] font-semibold whitespace-nowrap" :class="instances.length > 1 && 'sr-only'">
      {{ t('popup.title') }}
    </h1>
    <InstanceChips class="ml-auto min-w-0" :instances="instances" @open="emit('openInstance', $event)" />
    <Button variant="ghost" size="icon-sm" :aria-label="t('common.settings')" @click="emit('openSettings')">
      <SettingsIcon class="size-4" />
    </Button>
  </header>
</template>

<script setup lang="ts">
import { SettingsIcon } from '@lucide/vue'

import { i18n } from '#i18n'
import BrandMark from '@/components/base/BrandMark.vue'
import { Button } from '@/components/ui/button'
import type { InstanceStatus } from '@/lib/state'

import InstanceChips from './InstanceChips.vue'

defineProps<{ instances: InstanceStatus[] }>()

const emit = defineEmits<{ openSettings: []; openInstance: [id: string] }>()

const t = i18n.t
</script>
