<template>
  <BasePanel :label="t('popup.blocking.switch')" :tone="paused ? 'warning' : 'default'" class="mx-2.5 mt-2.5">
    <div class="flex items-center gap-2.5 px-3 py-2.5">
      <StatusDot :tone="dotTone" halo />
      <div class="min-w-0 flex-1">
        <div class="font-semibold">{{ label }}</div>
        <div class="text-muted-foreground text-[11px]" :class="sublineClass" aria-live="polite">
          <template v-if="paused && countdown.text.value">
            <span v-if="state.instances.length === 1">{{ t('popup.blocking.backIn', ['']) }}</span>
            <span v-else-if="state.instances.length === 2">{{ t('popup.blocking.backInBoth', ['']) }}</span>
            <span v-else>{{ t('popup.blocking.backInAll', ['']) }}</span>
            <span class="text-warning font-mono font-semibold">{{ countdown.text.value }}</span>
          </template>
          <template v-else-if="state.overall === 'enabled' && !state.degraded && hasStats">
            <span class="text-ink-2 font-mono">{{ state.instances.length }}</span>
            {{ ' ' }}{{ piHolesWord }} ·
            <span class="text-ink-2 font-mono">{{ state.clients }}</span>
            {{ ' ' }}{{ t('popup.blocking.statsClients') }} ·
            <span class="text-ink-2 font-mono">{{ percent }}</span>
            {{ ' ' }}{{ t('popup.blocking.statsBlocked') }}
          </template>
          <template v-else>{{ subline }}</template>
        </div>
      </div>
      <BaseSwitch
        :model-value="switchOn"
        :label="t('popup.blocking.switch')"
        :disabled="disabled || state.overall === 'error'"
        @update:model-value="emit('toggle')"
      />
    </div>

    <PanelSection class="flex flex-col gap-1.5 pt-2 pb-2.5">
      <PanelHeading v-if="state.overall !== 'error'">
        {{ paused ? t('popup.blocking.timer') : t('popup.blocking.disableAllFor') }}
        <template #right>
          <span class="text-ink-4 font-mono text-[10px]">{{ t('popup.blocking.toggleHint') }}</span>
        </template>
      </PanelHeading>
      <div v-if="state.overall === 'error'" class="flex gap-1.5">
        <Button variant="secondary" size="sm" class="flex-1" :disabled="disabled" @click="emit('retry')">
          {{ t('common.retry') }}
        </Button>
        <Button v-if="actionNeeded" variant="secondary" size="sm" class="flex-1" @click="emit('openSettings')">
          {{ t('popup.error.openSettings') }}
        </Button>
      </div>
      <ResumeRow
        v-else-if="paused"
        :disabled="disabled"
        :can-extend="state.timerEndsAt !== null"
        @resume="emit('resume')"
        @extend="emit('extend', $event)"
      />
      <PausePresets v-else :disabled="disabled" @pick="emit('pause', $event)" />
      <p v-if="error" role="alert" class="text-destructive flex items-center gap-2 text-[11px]">
        <span class="min-w-0 flex-1">{{ errorMessage(error) }}</span>
        <Button variant="link" @click="emit('retry')">{{ t('common.retry') }}</Button>
      </p>
    </PanelSection>
  </BasePanel>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { i18n } from '#i18n'
import BasePanel from '@/components/base/BasePanel.vue'
import BaseSwitch from '@/components/base/BaseSwitch.vue'
import PanelHeading from '@/components/base/PanelHeading.vue'
import PanelSection from '@/components/base/PanelSection.vue'
import StatusDot, { type StatusTone } from '@/components/base/StatusDot.vue'
import { Button } from '@/components/ui/button'
import { useCountdown } from '@/composables/useCountdown'
import { errorMessage } from '@/lib/error-messages'
import type { PiholeErrorData } from '@/lib/pihole/errors'
import type { ExtensionState } from '@/lib/state'

import PausePresets from './PausePresets.vue'
import ResumeRow from './ResumeRow.vue'

const props = withDefaults(
  defineProps<{ state: ExtensionState; disabled?: boolean; error?: PiholeErrorData | null }>(),
  {
    error: null
  }
)

const emit = defineEmits<{
  toggle: []
  pause: [seconds: number | null]
  resume: []
  extend: [seconds: number]
  retry: []
  openSettings: []
}>()

const t = i18n.t

const paused = computed(() => props.state.overall === 'paused')
const switchOn = computed(() => props.state.overall === 'enabled' || props.state.overall === 'mixed')
const countdown = useCountdown(() => (paused.value ? props.state.timerEndsAt : null))
const hasStats = computed(() => props.state.clients !== null && props.state.percentBlocked !== null)
const percent = computed(() => `${Math.round(props.state.percentBlocked ?? 0)} %`)
const piHolesWord = computed(() => t('popup.blocking.piHolesWord', props.state.instances.length))

const actionNeeded = computed(() =>
  props.state.instances.some((instance) => instance.error?.kind === 'unauthorized' || instance.error?.kind === 'seats')
)

const dotTone = computed<StatusTone>(() => {
  switch (props.state.overall) {
    case 'enabled':
      return props.state.degraded ? 'warning' : 'success'
    case 'paused':
    case 'mixed':
      return 'warning'
    case 'error':
      return actionNeeded.value ? 'warning' : 'danger'
    default:
      return 'info'
  }
})

const label = computed(() => {
  switch (props.state.overall) {
    case 'enabled':
      return t('popup.blocking.active')
    case 'paused':
      return t('popup.blocking.paused')
    case 'mixed':
      return t('popup.blocking.mixed')
    case 'error':
      return actionNeeded.value ? t('popup.blocking.actionNeeded') : t('popup.blocking.unreachable')
    default:
      return t('popup.blocking.actionNeeded')
  }
})

const failing = computed(() => props.state.instances.filter((instance) => instance.error !== null))
const healthy = computed(() => props.state.instances.filter((instance) => instance.error === null))

const subline = computed(() => {
  const { state } = props
  if (state.overall === 'paused') return t('popup.blocking.pausedIndefinitely')
  if (state.overall === 'mixed') {
    const pausedCount = state.instances.filter((instance) => instance.blocking === 'disabled').length
    return t('popup.blocking.partial', [String(pausedCount), String(state.instances.length - pausedCount)])
  }
  if (state.degraded && failing.value.length === 1 && healthy.value.length === 1) {
    return t('popup.blocking.onlyOne', [failing.value[0]!.name, healthy.value[0]!.name])
  }
  if (state.overall === 'error') {
    const first = failing.value[0]?.error
    return first ? errorMessage(first) : ''
  }
  return t('popup.blocking.piHoles', state.instances.length)
})

const sublineClass = computed(() => (props.state.degraded && props.state.overall !== 'error' ? 'text-warning' : ''))
</script>
