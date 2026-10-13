<template>
  <BasePanel :label="t('popup.site.label')" class="mx-2.5 mt-2.5">
    <div class="flex items-center gap-2.5 px-3 py-2.5">
      <component :is="icon" class="size-[18px] shrink-0" :class="toneClass" aria-hidden="true" />
      <div class="min-w-0 flex-1">
        <div class="truncate font-mono text-xs font-semibold" :title="hostname">{{ hostname }}</div>
        <div class="min-h-4 truncate text-[11px]" :class="toneClass" aria-live="polite">{{ statusText }}</div>
      </div>
    </div>

    <PanelSection class="grid grid-cols-2 gap-1.5 pt-2 pb-2">
      <Button
        variant="secondary"
        size="sm"
        class="justify-start px-2"
        :class="allowedByYou && 'border-success bg-success-soft font-semibold'"
        :disabled="busy"
        :aria-pressed="allowedByYou"
        aria-keyshortcuts="a"
        @click="allowedByYou ? emit('remove', 'allow') : emit('allow')"
      >
        <ShieldCheckIcon class="text-success" />
        {{ allowedByYou ? t('popup.site.allowed') : t('popup.site.allow') }}
        <BaseKbd>A</BaseKbd>
      </Button>
      <Button
        variant="secondary"
        size="sm"
        class="justify-start px-2"
        :class="deniedByYou && 'border-destructive bg-danger-soft font-semibold'"
        :disabled="busy"
        :aria-pressed="deniedByYou"
        aria-keyshortcuts="d"
        @click="deniedByYou ? emit('remove', 'deny') : emit('deny')"
      >
        <ShieldBanIcon class="text-destructive" />
        {{ deniedByYou ? t('popup.site.denied') : t('popup.site.deny') }}
        <BaseKbd>D</BaseKbd>
      </Button>
    </PanelSection>

    <!-- Wraps instead of overflowing when a translation is too long for one line; the second link stays right. -->
    <div class="flex flex-wrap items-center justify-between gap-x-3 px-3 pb-2.5 text-[11px]">
      <Button v-if="allowedByYou" variant="link" :disabled="busy" @click="emit('remove', 'allow')">
        <Trash2Icon class="size-3" />
        {{ t('popup.site.removeAllow') }}
      </Button>
      <Button v-else-if="deniedByYou" variant="link" :disabled="busy" @click="emit('remove', 'deny')">
        <Trash2Icon class="size-3" />
        {{ t('popup.site.removeDeny') }}
      </Button>
      <Button v-else variant="link" :disabled="busy" @click="emit('tempAllow')">
        <ClockIcon class="size-3" />
        {{ t('popup.site.allowTemp', [String(tempAllowMinutes)]) }}
      </Button>
      <Button variant="link-muted" class="ml-auto" @click="emit('open')">
        {{ t('popup.site.openAdmin') }}
        <ExternalLinkIcon class="size-[11px]" />
      </Button>
    </div>

    <p v-if="error" role="alert" class="text-destructive px-3 pb-2.5 text-[11px]">
      <span v-if="errorSource" class="font-semibold">{{ errorSource }} · </span>{{ errorMessage(error) }}
    </p>
  </BasePanel>
</template>

<script setup lang="ts">
import { ClockIcon, ExternalLinkIcon, ShieldBanIcon, ShieldCheckIcon, ShieldIcon, Trash2Icon } from '@lucide/vue'
import { computed } from 'vue'

import { i18n } from '#i18n'
import BaseKbd from '@/components/base/BaseKbd.vue'
import BasePanel from '@/components/base/BasePanel.vue'
import PanelSection from '@/components/base/PanelSection.vue'
import { Button } from '@/components/ui/button'
import { useCountdown } from '@/composables/useCountdown'
import { errorMessage } from '@/lib/error-messages'
import type { PiholeErrorData } from '@/lib/pihole/errors'
import type { ListType, SiteStatus } from '@/lib/pihole/site-status'

const props = withDefaults(
  defineProps<{
    hostname: string
    site: SiteStatus | null
    paused?: boolean
    loading?: boolean
    busy?: boolean
    tempAllowMinutes?: number
    error?: PiholeErrorData | null
    /** Name of the Pi-hole the error came from, shown when several are configured. */
    errorSource?: string | null
  }>(),
  { tempAllowMinutes: 10, error: null, errorSource: null }
)

const emit = defineEmits<{
  allow: []
  deny: []
  remove: [list: ListType]
  tempAllow: []
  open: []
}>()

const t = i18n.t

const verdict = computed(() => props.site?.verdict ?? 'unknown')
const allowedByYou = computed(() => verdict.value === 'allowed-own' || verdict.value === 'allowed-temp')
const deniedByYou = computed(() => verdict.value === 'blocked-own')
const tempCountdown = useCountdown(() => (verdict.value === 'allowed-temp' ? (props.site?.tempUntil ?? null) : null))

const tone = computed<'success' | 'danger' | 'muted'>(() => {
  if (props.paused) return 'muted'
  switch (verdict.value) {
    case 'allowed-own':
    case 'allowed-temp':
    case 'allowed-list':
      return 'success'
    case 'blocked-own':
    case 'blocked-list':
      return 'danger'
    default:
      return 'muted'
  }
})

const toneClass = computed(
  () => ({ success: 'text-success', danger: 'text-destructive', muted: 'text-muted-foreground' })[tone.value]
)

const icon = computed(() => {
  if (props.paused) return ShieldIcon
  if (tone.value === 'success') return ShieldCheckIcon
  if (tone.value === 'danger') return ShieldBanIcon
  return ShieldIcon
})

const statusText = computed(() => {
  if (props.loading && !props.site) return t('popup.site.checking')
  if (props.paused) return t('popup.site.paused')
  const site = props.site
  switch (verdict.value) {
    case 'allowed-own':
      return t('popup.site.allowedByYou')
    case 'allowed-temp': {
      // Minute granularity: the line is a live region and must not re-announce every second.
      const minutes = Math.max(1, Math.ceil((tempCountdown.remainingMs.value ?? 0) / 60_000))
      return t('popup.site.allowedTemp', [String(minutes)])
    }
    case 'allowed-list':
      return t('popup.site.allowedByList', [site?.listName ?? ''])
    case 'blocked-own':
      return t('popup.site.blockedByYou')
    case 'blocked-list':
      return t('popup.site.blockedByList', [site?.listName ?? ''])
    case 'not-blocked':
      return t('popup.site.notBlocked')
    default:
      return t('popup.site.unknown')
  }
})
</script>
