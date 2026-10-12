<template>
  <div class="flex flex-col gap-2.5 px-3.5 py-3">
    <p class="text-muted-foreground text-[11.5px]">{{ t('options.about.debugHint') }}</p>
    <pre
      class="bg-background border-border text-ink-2 overflow-x-auto rounded-sm border px-3 py-2 font-mono text-[11px] leading-[1.7] whitespace-pre-wrap"
      >{{ text }}</pre>
    <div class="flex items-center gap-2">
      <Button variant="secondary" size="sm" @click="copy">
        <CopyIcon />
        {{ t('common.copy') }}
      </Button>
      <span class="text-success text-[11.5px] font-semibold" aria-live="polite">{{
        copied ? t('common.copied') : ''
      }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CopyIcon } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'

import { i18n } from '#i18n'
import { browser } from '#imports'
import { Button } from '@/components/ui/button'
import { detectBrowser } from '@/lib/browser-info'
import { errorMessage } from '@/lib/error-messages'
import type { ExtensionState } from '@/lib/state'
import { formatVersions } from '@/lib/version'

const props = defineProps<{ state: ExtensionState | null }>()

const t = i18n.t
const platform = ref('')
const copied = ref(false)

onMounted(async () => {
  try {
    const info = await browser.runtime.getPlatformInfo()
    platform.value = `${info.os} ${info.arch}`
  } catch {
    platform.value = navigator.platform
  }
})

const text = computed(() => {
  const ua = detectBrowser()
  const lines = [
    `${t('options.about.extensionVersion')}: ${browser.runtime.getManifest().version}`,
    `${t('options.about.browser')}: ${ua.name} ${ua.version}`.trim(),
    `${t('options.about.os')}: ${platform.value}`
  ]
  for (const instance of props.state?.instances ?? []) {
    const detail = instance.error ? errorMessage(instance.error) : formatVersions(instance.versions) || '-'
    lines.push(`${t('options.about.piHole', [instance.name])}: ${detail}`)
  }
  return lines.join('\n')
})

let timer: ReturnType<typeof setTimeout> | undefined

async function copy(): Promise<void> {
  try {
    await navigator.clipboard.writeText(text.value)
    copied.value = true
    clearTimeout(timer)
    timer = setTimeout(() => (copied.value = false), 1500)
  } catch {
    // Clipboard access can be denied; the text stays selectable.
  }
}
</script>
