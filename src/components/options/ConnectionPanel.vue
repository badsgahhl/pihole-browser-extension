<template>
  <div class="flex flex-col gap-2.5 px-[18px] py-4">
    <PanelHeading>{{ t('options.instances.connection') }}</PanelHeading>

    <div
      v-if="phase === 'testing'"
      class="text-muted-foreground flex items-center gap-2 text-[12.5px]"
      aria-live="polite"
    >
      <LoaderCircleIcon class="size-3.5 animate-spin" aria-hidden="true" />
      {{ t('options.instances.testing') }}
    </div>
    <template v-else-if="view.kind === 'ok'">
      <div class="text-success flex items-center gap-2 font-semibold" aria-live="polite">
        <CheckIcon class="size-3.5" aria-hidden="true" />
        {{ view.noAuth ? t('options.instances.noAuthNeeded') : t('options.instances.connected') }}
      </div>
      <div v-if="view.lines.length" class="text-ink-2 font-mono text-[11px] leading-[1.7]">
        <div v-for="line in view.lines" :key="line">{{ line }}</div>
      </div>
    </template>
    <p v-else-if="view.kind === 'error'" role="alert" class="text-destructive text-xs">
      {{ errorMessage(view.error) }}
    </p>
    <p v-else class="text-muted-foreground text-xs">{{ t('options.instances.untested') }}</p>

    <div
      v-if="host && access !== 'unknown'"
      class="border-border text-muted-foreground flex items-start gap-2 border-t pt-2.5 text-[11.5px]"
      :class="access === 'denied' && 'text-destructive'"
    >
      <component
        :is="access === 'granted' ? LockIcon : LockOpenIcon"
        class="mt-px size-3.5 shrink-0"
        :class="access === 'denied' ? 'text-destructive' : 'text-accent'"
        aria-hidden="true"
      />
      <span>
        {{ accessText.before }}<span class="text-ink-2 font-mono">{{ host }}</span
        >{{ accessText.after }}
      </span>
    </div>

    <Button variant="secondary" size="sm" class="self-start" :disabled="phase !== 'idle'" @click="emit('test')">
      <RefreshCwIcon />
      {{ view.kind === 'none' ? t('options.instances.test') : t('options.instances.testAgain') }}
    </Button>
  </div>
</template>

<script setup lang="ts">
import { CheckIcon, LoaderCircleIcon, LockIcon, LockOpenIcon, RefreshCwIcon } from '@lucide/vue'
import { computed } from 'vue'

import { i18n } from '#i18n'
import PanelHeading from '@/components/base/PanelHeading.vue'
import { Button } from '@/components/ui/button'
import { errorMessage } from '@/lib/error-messages'
import type { InstanceTestResult } from '@/lib/pihole/actions'
import type { PiholeErrorData } from '@/lib/pihole/errors'
import type { InstanceStatus } from '@/lib/state'
import { versionLines } from '@/lib/version'

export type EditorPhase = 'idle' | 'testing' | 'saving'
export type AccessState = 'unknown' | 'granted' | 'pending' | 'denied'
export type TestOutcome =
  | { kind: 'none' }
  | { kind: 'ok'; result: InstanceTestResult }
  | { kind: 'error'; error: PiholeErrorData }

type View =
  | { kind: 'none' }
  | { kind: 'ok'; noAuth: boolean; lines: string[] }
  | { kind: 'error'; error: PiholeErrorData }

const props = defineProps<{
  phase: EditorPhase
  outcome: TestOutcome
  /** Live status of the instance being edited, shown until a test gives a fresher answer. */
  status: InstanceStatus | null
  access: AccessState
  host: string
}>()
const emit = defineEmits<{ test: [] }>()

const t = i18n.t

const view = computed<View>(() => {
  const { outcome, status } = props
  if (outcome.kind === 'ok') {
    return { kind: 'ok', noAuth: outcome.result.auth === 'none-needed', lines: versionLines(outcome.result.versions) }
  }
  if (outcome.kind === 'error') {
    // The access line below already explains a missing permission.
    return outcome.error.kind === 'permission' ? { kind: 'none' } : outcome
  }
  if (status?.error) return { kind: 'error', error: status.error }
  if (status?.versions) return { kind: 'ok', noAuth: status.noAuth, lines: versionLines(status.versions) }
  return { kind: 'none' }
})

const accessText = computed(() => {
  const key =
    props.access === 'granted'
      ? 'options.instances.accessGranted'
      : props.access === 'denied'
        ? 'options.instances.accessDenied'
        : 'options.instances.accessPending'
  const marker = '[[host]]'
  const [before = '', after = ''] = t(key, [marker]).split(marker)
  return { before, after }
})
</script>
