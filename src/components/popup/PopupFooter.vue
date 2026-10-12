<template>
  <footer
    v-if="versions || messages || state.updateAvailable || (paused && reloadsOnPause)"
    class="border-border text-muted-foreground mt-auto flex h-[30px] shrink-0 items-center gap-2 border-t px-3 font-mono text-[10.5px]"
  >
    <span class="truncate">{{ versions }}</span>
    <span class="ml-auto flex shrink-0 items-center gap-2">
      <span v-if="messages" class="text-ink-4 font-sans text-[10px]">{{ messages }}</span>
      <BaseChip v-if="state.updateAvailable" tone="warning" class="font-sans text-[10px]">
        <ArrowUpIcon class="size-2.5" />
        {{ t('common.updateAvailable') }}
      </BaseChip>
      <span
        v-else-if="versions"
        class="text-success inline-flex items-center gap-1 font-sans text-[10px] font-semibold"
      >
        <CheckIcon class="size-2.5" />
        {{ t('common.upToDate') }}
      </span>
      <span v-else-if="paused && reloadsOnPause" class="text-ink-4 font-sans text-[10px]">{{
        t('popup.blocking.reloadsOnPause')
      }}</span>
    </span>
  </footer>
</template>

<script setup lang="ts">
import { ArrowUpIcon, CheckIcon } from '@lucide/vue'
import { computed } from 'vue'

import { i18n } from '#i18n'
import BaseChip from '@/components/base/BaseChip.vue'
import type { ExtensionState } from '@/lib/state'
import { bareVersion } from '@/lib/version'

const props = defineProps<{ state: ExtensionState; reloadsOnPause?: boolean }>()

const t = i18n.t

const paused = computed(() => props.state.overall === 'paused')

const versions = computed(() => {
  const first = props.state.instances.find((instance) => instance.versions?.core)
  if (!first?.versions) return ''
  const parts = [`Core ${bareVersion(first.versions.core)}`]
  if (first.versions.ftl) parts.push(`FTL ${bareVersion(first.versions.ftl)}`)
  return parts.join(' · ')
})

const messages = computed(() => {
  const count = props.state.messagesCount
  return count ? t('popup.footer.messages', count) : ''
})
</script>
