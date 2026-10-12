<template>
  <div :aria-label="t('popup.instances')" class="flex gap-1">
    <template v-if="instances.length <= 3">
      <InstanceChip
        v-for="instance in instances"
        :key="instance.id"
        :instance="instance"
        @open="emit('open', $event)"
      />
    </template>
    <BaseChip
      v-else
      as="button"
      class="h-[22px] text-[11px] font-medium"
      :title="summaryTitle"
      :aria-label="summaryTitle"
      @click="emit('open', instances[0]?.id ?? '')"
    >
      <StatusDot v-for="instance in instances" :key="instance.id" size="sm" :tone="dotTone(instance)" />
      <span>{{ instances.length }}</span>
    </BaseChip>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { i18n } from '#i18n'
import BaseChip from '@/components/base/BaseChip.vue'
import StatusDot, { type StatusTone } from '@/components/base/StatusDot.vue'
import type { InstanceStatus } from '@/lib/state'

import InstanceChip from './InstanceChip.vue'

const props = defineProps<{ instances: InstanceStatus[] }>()

const emit = defineEmits<{ open: [id: string] }>()

const t = i18n.t

function dotTone(instance: InstanceStatus): StatusTone {
  if (instance.error) return 'danger'
  if (instance.blocking === 'enabled') return 'success'
  if (instance.blocking === 'disabled') return 'warning'
  return 'neutral'
}

const summaryTitle = computed(() =>
  [t('popup.moreInstances', props.instances.length), ...props.instances.map((instance) => instance.name)].join(' · ')
)
</script>
