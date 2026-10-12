<template>
  <div
    class="border-border grid grid-cols-[16px_minmax(0,1.2fr)_minmax(0,1fr)_auto_auto] items-center gap-3.5 border-b px-3.5 py-3"
  >
    <StatusDot :tone="tone" halo class="justify-self-center" />
    <div class="min-w-0">
      <div class="font-semibold">{{ instance.name }}</div>
      <div class="text-muted-foreground truncate font-mono text-[11px]">{{ instance.url }}</div>
    </div>
    <div v-if="status?.error" class="text-destructive truncate text-[11px]">{{ errorText }}</div>
    <div v-else class="text-ink-2 truncate font-mono text-[11px]">{{ versions || t('status.unknown') }}</div>
    <div class="flex justify-end">
      <Button v-if="status?.error?.kind === 'permission'" variant="outline" size="xs" @click="emit('grant')">
        {{ t('common.grantAccess') }}
      </Button>
      <BaseChip v-else-if="status?.error" tone="neutral">{{ t('common.noSession') }}</BaseChip>
      <BaseChip v-else-if="status?.versions?.updateAvailable" tone="warning">
        <ArrowUpIcon class="size-2.5" />
        {{ t('common.updateAvailable') }}
      </BaseChip>
      <BaseChip v-else-if="status?.versions" tone="success">
        <CheckIcon class="size-2.5" />
        {{ t('common.upToDate') }}
      </BaseChip>
    </div>
    <div class="flex gap-1">
      <Button
        :variant="editing ? 'outline' : 'ghost'"
        size="icon-sm"
        :aria-label="t('options.instances.edit', [instance.name])"
        :aria-pressed="editing"
        @click="emit('edit')"
      >
        <PencilIcon />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        :aria-label="t('options.instances.remove', [instance.name])"
        @click="emit('remove')"
      >
        <Trash2Icon />
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowUpIcon, CheckIcon, PencilIcon, Trash2Icon } from '@lucide/vue'
import { computed } from 'vue'

import { i18n } from '#i18n'
import BaseChip from '@/components/base/BaseChip.vue'
import StatusDot, { type StatusTone } from '@/components/base/StatusDot.vue'
import { Button } from '@/components/ui/button'
import { errorMessage } from '@/lib/error-messages'
import type { Instance } from '@/lib/settings/schema'
import type { InstanceStatus } from '@/lib/state'
import { formatVersions } from '@/lib/version'

const props = defineProps<{ instance: Instance; status: InstanceStatus | null; editing?: boolean }>()
const emit = defineEmits<{ edit: []; remove: []; grant: [] }>()

const t = i18n.t

const tone = computed<StatusTone>(() => {
  const status = props.status
  if (!status) return 'neutral'
  if (status.error) return status.error.kind === 'permission' ? 'info' : 'danger'
  if (status.blocking === 'enabled') return 'success'
  if (status.blocking === 'disabled') return 'warning'
  return 'neutral'
})

const versions = computed(() => formatVersions(props.status?.versions, { docker: false }))

/** Rows keep status text short; the editor shows the full explanation. */
const errorText = computed(() => {
  const error = props.status?.error
  if (!error) return ''
  return error.kind === 'permission' ? t('options.instances.noAccess') : errorMessage(error)
})
</script>
