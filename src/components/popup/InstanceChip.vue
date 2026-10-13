<template>
  <BaseChip
    as="button"
    :tone="tone"
    :title="title"
    :aria-label="title"
    class="h-[22px] min-w-0 text-[11px] font-medium"
    @click="emit('open', instance.id)"
  >
    <StatusDot size="sm" :tone="dotTone" />
    <span class="max-w-[72px] min-w-0 truncate">{{ instance.name }}</span>
  </BaseChip>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import BaseChip, { type ChipTone } from '@/components/base/BaseChip.vue'
import StatusDot, { type StatusTone } from '@/components/base/StatusDot.vue'
import { statusLabel } from '@/lib/error-messages'
import type { InstanceStatus } from '@/lib/state'
import { formatVersions } from '@/lib/version'

const props = defineProps<{ instance: InstanceStatus }>()

const emit = defineEmits<{ open: [id: string] }>()

const dotTone = computed<StatusTone>(() => {
  const { error, blocking } = props.instance
  if (error)
    return error.kind === 'permission' || error.kind === 'unauthorized' || error.kind === 'seats' ? 'warning' : 'danger'
  if (blocking === 'enabled') return 'success'
  if (blocking === 'disabled') return 'warning'
  return 'neutral'
})

const tone = computed<ChipTone>(() => {
  const kind = props.instance.error?.kind
  if (!kind) return 'neutral'
  return kind === 'permission' || kind === 'unauthorized' || kind === 'seats' ? 'warning' : 'danger'
})

const title = computed(() => {
  const { instance } = props
  const blocking = instance.blocking === 'enabled' || instance.blocking === 'disabled' ? instance.blocking : null
  const parts = [instance.name, statusLabel(instance.error, blocking)]
  const versions = formatVersions(instance.versions, { docker: false })
  if (versions) parts.push(versions)
  return parts.join(' · ')
})
</script>
