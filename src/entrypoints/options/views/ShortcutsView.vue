<template>
  <PageHeader :title="t('options.shortcuts.title')" :intro="t('options.shortcuts.intro')" />

  <BasePanel :label="t('options.shortcuts.global')">
    <PanelHead>{{ t('options.shortcuts.global') }}</PanelHead>
    <table class="w-full text-[12.5px]">
      <thead>
        <tr class="text-muted-foreground text-[10.5px] tracking-[0.04em] uppercase">
          <th class="px-3.5 py-2 text-left font-semibold">{{ t('options.shortcuts.action') }}</th>
          <th class="px-3.5 py-2 text-left font-semibold">{{ t('options.shortcuts.shortcut') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="command in commands" :key="command.name" class="border-border border-t">
          <td class="px-3.5 py-2">{{ command.description }}</td>
          <td class="px-3.5 py-2"><ShortcutKeys :shortcut="command.shortcut" /></td>
        </tr>
      </tbody>
    </table>
    <div class="border-border flex items-center gap-3 border-t px-3.5 py-2.5">
      <Button v-if="shortcutsUrl" variant="outline" size="sm" @click="openShortcuts">
        <ExternalLinkIcon />
        {{ t('options.shortcuts.change') }}
      </Button>
      <p v-else class="text-muted-foreground text-[11.5px]">{{ t('options.shortcuts.firefoxHint') }}</p>
    </div>
  </BasePanel>

  <BasePanel :label="t('options.shortcuts.popupKeys')">
    <PanelHead>{{ t('options.shortcuts.popupKeys') }}</PanelHead>
    <table class="w-full text-[12.5px]">
      <tbody>
        <tr v-for="(entry, index) in popupKeys" :key="entry.label" :class="index > 0 && 'border-border border-t'">
          <td class="px-3.5 py-2">{{ entry.label }}</td>
          <td class="px-3.5 py-2"><ShortcutKeys :shortcut="entry.keys" /></td>
        </tr>
      </tbody>
    </table>
  </BasePanel>
</template>

<script setup lang="ts">
import { ExternalLinkIcon } from '@lucide/vue'
import { onMounted, ref } from 'vue'

import { i18n } from '#i18n'
import { browser } from '#imports'
import BasePanel from '@/components/base/BasePanel.vue'
import PageHeader from '@/components/options/PageHeader.vue'
import PanelHead from '@/components/options/PanelHead.vue'
import ShortcutKeys from '@/components/options/ShortcutKeys.vue'
import { Button } from '@/components/ui/button'
import { detectBrowser, shortcutsPageUrl } from '@/lib/browser-info'
import { COMMAND_ORDER } from '@/lib/commands'
import { formatDuration, PAUSE_PRESETS } from '@/lib/duration'

interface CommandRow {
  name: string
  description: string
  shortcut: string
}

const t = i18n.t
const commands = ref<CommandRow[]>([])
const shortcutsUrl = shortcutsPageUrl(detectBrowser())

onMounted(async () => {
  try {
    const all = await browser.commands.getAll()
    const rank = (name: string) => {
      const index = COMMAND_ORDER.indexOf(name)
      return index === -1 ? COMMAND_ORDER.length : index
    }
    commands.value = all
      .filter((command) => command.name && !command.name.startsWith('_'))
      .map((command) => ({
        name: command.name ?? '',
        description: command.description ?? command.name ?? '',
        shortcut: command.shortcut ?? ''
      }))
      .sort((a, b) => rank(a.name) - rank(b.name))
  } catch {
    commands.value = []
  }
})

async function openShortcuts(): Promise<void> {
  if (shortcutsUrl) await browser.tabs.create({ url: shortcutsUrl })
}

const popupKeys = [
  { label: t('options.shortcuts.toggle'), keys: 'T' },
  { label: t('options.shortcuts.allow'), keys: 'A' },
  { label: t('options.shortcuts.deny'), keys: 'D' },
  ...PAUSE_PRESETS.map((seconds, index) => ({
    label: t('options.shortcuts.preset', [seconds === 0 ? '∞' : formatDuration(seconds)]),
    keys: String(index + 1)
  })),
  { label: t('options.shortcuts.close'), keys: 'Esc' }
]
</script>
