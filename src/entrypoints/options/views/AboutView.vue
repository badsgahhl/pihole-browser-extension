<template>
  <PageHeader :title="t('options.about.title')" :intro="t('options.about.intro')" />

  <BasePanel :label="t('options.about.title')">
    <PanelHead>{{ t('options.about.title') }}</PanelHead>
    <div class="flex flex-col gap-3 px-3.5 py-3 text-[12.5px]">
      <p class="text-ink-2 max-w-[640px]">{{ t('options.about.description') }}</p>
      <div class="flex flex-wrap gap-x-4 gap-y-1.5">
        <a
          v-for="link in links"
          :key="link.href"
          :href="link.href"
          target="_blank"
          rel="noreferrer"
          class="text-accent inline-flex items-center gap-1 font-medium hover:underline"
        >
          {{ link.label }}
          <ExternalLinkIcon class="size-3" aria-hidden="true" />
        </a>
      </div>
    </div>
  </BasePanel>

  <BasePanel :label="t('options.about.contributors')">
    <PanelHead>{{ t('options.about.contributors') }}</PanelHead>
    <ul class="flex flex-wrap gap-1.5 px-3.5 py-3">
      <li v-for="person in CONTRIBUTORS" :key="person.name">
        <a :href="person.url" target="_blank" rel="noreferrer">
          <BaseChip tone="neutral" class="hover:text-foreground h-6 px-2 text-[11.5px]">{{ person.name }}</BaseChip>
        </a>
      </li>
    </ul>
  </BasePanel>

  <BasePanel :label="t('options.about.debug')">
    <PanelHead>{{ t('options.about.debug') }}</PanelHead>
    <DebugInfo :state="state" />
  </BasePanel>
</template>

<script setup lang="ts">
import { ExternalLinkIcon } from '@lucide/vue'

import { i18n } from '#i18n'
import BaseChip from '@/components/base/BaseChip.vue'
import BasePanel from '@/components/base/BasePanel.vue'
import DebugInfo from '@/components/options/DebugInfo.vue'
import PageHeader from '@/components/options/PageHeader.vue'
import PanelHead from '@/components/options/PanelHead.vue'
import { useExtensionState } from '@/composables/useExtensionState'
import { CONTRIBUTORS, DONATE_URL, NEW_ISSUE_URL, REPO_URL, TROUBLESHOOTING_URL } from '@/lib/links'

const t = i18n.t
const { state } = useExtensionState()

const links = [
  { href: REPO_URL, label: t('options.about.source') },
  { href: TROUBLESHOOTING_URL, label: t('options.about.troubleshooting') },
  { href: NEW_ISSUE_URL, label: t('options.about.issues') },
  { href: DONATE_URL, label: t('options.nav.donate') }
]
</script>
