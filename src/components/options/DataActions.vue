<template>
  <div class="flex flex-wrap items-center gap-4 px-3.5 py-3">
    <div class="min-w-[240px] flex-1">
      <div class="font-medium">{{ t('options.general.settingsFile.title') }}</div>
      <div class="text-muted-foreground text-[11.5px]">{{ t('options.general.settingsFile.text') }}</div>
      <p v-if="error" role="alert" class="text-destructive mt-1 text-[11.5px]">{{ error }}</p>
    </div>
    <div class="flex flex-wrap gap-1.5">
      <Button variant="secondary" size="sm" :disabled="busy" @click="exportFile">
        <DownloadIcon />
        {{ t('options.general.export') }}
      </Button>
      <Button variant="secondary" size="sm" :disabled="busy" @click="fileInput?.click()">
        <UploadIcon />
        {{ t('options.general.import') }}
      </Button>
      <input ref="fileInput" type="file" accept="application/json,.json" class="hidden" @change="onFile" />
      <Button variant="destructive" size="sm" :disabled="busy" @click="resetOpen = true">
        {{ t('options.general.reset') }}
      </Button>
    </div>

    <ConfirmDialog
      v-model:open="importOpen"
      :title="t('options.general.importConfirm.title')"
      :text="t('options.general.importConfirm.text')"
      :confirm-label="t('options.general.import')"
      @confirm="importNow"
    />
    <ConfirmDialog
      v-model:open="resetOpen"
      :title="t('options.general.resetConfirm.title')"
      :text="t('options.general.resetConfirm.text')"
      :confirm-label="t('options.general.reset')"
      destructive
      @confirm="resetNow"
    />
  </div>
</template>

<script setup lang="ts">
import { DownloadIcon, UploadIcon } from '@lucide/vue'
import { ref, useTemplateRef } from 'vue'

import { i18n } from '#i18n'
import { Button } from '@/components/ui/button'
import { sendMessage } from '@/lib/messaging'

import ConfirmDialog from './ConfirmDialog.vue'

const t = i18n.t

// A real input instead of useFileDialog: its change event can be driven in tests with a File.
const fileInput = useTemplateRef<HTMLInputElement>('fileInput')
// The dialog clears its open flag before confirm fires, so the file content lives in its own ref.
const pendingJson = ref<string | null>(null)
const importOpen = ref(false)
const resetOpen = ref(false)
const busy = ref(false)
const error = ref('')

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Hands the export to the browser as a download; no host permission or extra API is needed. */
function downloadJson(json: string, filename: string): void {
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function exportFile(): Promise<void> {
  error.value = ''
  busy.value = true
  try {
    downloadJson(await sendMessage('exportSettings', undefined), `pihole-switch-settings-${today()}.json`)
  } finally {
    busy.value = false
  }
}

async function onFile(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  error.value = ''
  pendingJson.value = await file.text()
  importOpen.value = true
}

async function importNow(): Promise<void> {
  importOpen.value = false
  const json = pendingJson.value
  pendingJson.value = null
  if (json === null) return
  busy.value = true
  try {
    await sendMessage('importSettings', { json })
  } catch {
    error.value = t('options.general.importInvalid')
  } finally {
    busy.value = false
  }
}

async function resetNow(): Promise<void> {
  resetOpen.value = false
  busy.value = true
  try {
    await sendMessage('resetSettings', undefined)
  } finally {
    busy.value = false
  }
}
</script>
