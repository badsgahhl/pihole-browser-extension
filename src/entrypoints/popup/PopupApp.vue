<template>
  <main class="bg-background text-foreground flex w-[320px] flex-col">
    <PopupHeader
      :instances="state?.instances ?? []"
      @open-settings="openOptions()"
      @open-instance="openOptions(`/pi-holes/${$event}`)"
    />

    <template v-if="!state">
      <div class="mx-2.5 mt-2.5 flex flex-col gap-2">
        <Skeleton class="h-24 rounded-sm" />
        <Skeleton class="h-28 rounded-sm" />
      </div>
    </template>

    <EmptyState v-else-if="state.overall === 'needs-setup'" @add="openOptions('/pi-holes/new')" />

    <template v-else>
      <PermissionBanner v-if="needsPermission" @grant="openOptions('/pi-holes')" />
      <BlockingCard
        :state="state"
        :disabled="actions.pending.value !== null"
        :error="actions.error.value"
        :error-source="errorSourceName(actions.error.value, state.instances)"
        @toggle="actions.toggle()"
        @pause="actions.pause($event)"
        @resume="actions.resume()"
        @extend="actions.extend($event)"
        @retry="actions.refresh()"
        @open-settings="openOptions('/pi-holes')"
      />
      <SiteCard
        v-if="showSite && hostname"
        :hostname="hostname"
        :site="site.site.value"
        :paused="state.overall === 'paused'"
        :loading="site.loading.value"
        :busy="site.acting.value"
        :temp-allow-minutes="settings?.tempAllowMinutes"
        :error="site.error.value"
        :error-source="errorSourceName(site.error.value, state.instances)"
        @allow="site.allow()"
        @deny="site.deny()"
        @remove="site.remove($event)"
        @temp-allow="site.tempAllow()"
        @open="openAdmin"
      />
    </template>

    <div class="h-2.5" />
    <PopupFooter v-if="state" :state="state" :reloads-on-pause="settings?.reloadAfterPause" />
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { browser } from '#imports'
import BlockingCard from '@/components/popup/BlockingCard.vue'
import EmptyState from '@/components/popup/EmptyState.vue'
import PermissionBanner from '@/components/popup/PermissionBanner.vue'
import PopupFooter from '@/components/popup/PopupFooter.vue'
import PopupHeader from '@/components/popup/PopupHeader.vue'
import SiteCard from '@/components/popup/SiteCard.vue'
import { Skeleton } from '@/components/ui/skeleton'
import { useActions } from '@/composables/useActions'
import { useCurrentHostname } from '@/composables/useCurrentHostname'
import { useExtensionState } from '@/composables/useExtensionState'
import { useHotkeys } from '@/composables/useHotkeys'
import { useOpenOptions } from '@/composables/useOpenOptions'
import { useSettings } from '@/composables/useSettings'
import { useSiteStatus } from '@/composables/useSiteStatus'
import { useTheme } from '@/composables/useTheme'
import { PAUSE_PRESETS } from '@/lib/duration'
import { errorSourceName } from '@/lib/error-messages'

const { state } = useExtensionState()
const { settings } = useSettings()
const { hostname } = useCurrentHostname()
const actions = useActions()
const site = useSiteStatus(hostname)
const openOptions = useOpenOptions()

useTheme(computed(() => settings.value?.theme))

/** Any Pi-hole the browser may not talk to yet, whether or not the others are fine. */
const needsPermission = computed(
  () => state.value?.instances.some((instance) => instance.error?.kind === 'permission') ?? false
)

const showSite = computed(() => {
  const current = state.value
  return (
    current !== null &&
    settings.value?.showCurrentSite !== false &&
    current.overall !== 'needs-setup' &&
    current.overall !== 'needs-permission' &&
    current.overall !== 'error'
  )
})

function openAdmin() {
  const first = state.value?.instances[0]
  if (!first || !hostname.value) return
  void browser.tabs.create({ url: `${first.url}/admin/search?domain=${encodeURIComponent(hostname.value)}` })
  window.close()
}

const presetKeys = Object.fromEntries(
  PAUSE_PRESETS.map((seconds, index) => [String(index + 1), () => actions.pause(seconds === 0 ? null : seconds)])
)

useHotkeys({
  t: () => actions.toggle(),
  a: () => {
    if (showSite.value && hostname.value) void site.allow()
  },
  d: () => {
    if (showSite.value && hostname.value) void site.deny()
  },
  escape: () => window.close(),
  ...presetKeys
})
</script>
