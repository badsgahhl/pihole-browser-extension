<template>
  <PageHeader :title="t('options.instances.title')" :intro="t('options.instances.intro')" />

  <BasePanel :label="t('options.instances.title')">
    <template v-if="settings">
      <InstanceRow
        v-for="entry in settings.instances"
        :key="entry.id"
        :instance="entry"
        :status="statusOf(entry.id)"
        :editing="editingId === entry.id"
        @edit="router.push(`/pi-holes/${entry.id}`)"
        @remove="askRemove(entry)"
        @grant="grant(entry)"
      />
      <p v-if="settings.instances.length === 0" class="text-muted-foreground px-3.5 py-3 text-[12.5px]">
        {{ t('options.instances.empty') }}
      </p>
    </template>
    <div class="flex items-center justify-between px-3.5 py-2.5">
      <Button variant="outline" size="sm" :disabled="atLimit" @click="router.push('/pi-holes/new')">
        <PlusIcon />
        {{ t('options.instances.add') }}
      </Button>
      <span class="text-ink-4 text-[11px]">{{ t('options.instances.limit', [String(MAX_INSTANCES)]) }}</span>
    </div>
  </BasePanel>

  <InstanceForm
    v-if="settings && editorOpen"
    :key="editingId ?? 'new'"
    :instance="editingInstance"
    :instances="settings.instances"
    :status="editingInstance ? statusOf(editingInstance.id) : null"
    @saved="router.push('/pi-holes')"
    @cancel="router.push('/pi-holes')"
  />

  <ConfirmDialog
    :open="pendingRemove !== null"
    :title="t('options.instances.removeConfirm.title', [pendingRemove?.name ?? ''])"
    :text="t('options.instances.removeConfirm.text')"
    :confirm-label="t('common.remove')"
    destructive
    @update:open="(open) => !open && (pendingRemove = null)"
    @confirm="remove"
  />
</template>

<script setup lang="ts">
import { PlusIcon } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { i18n } from '#i18n'
import BasePanel from '@/components/base/BasePanel.vue'
import ConfirmDialog from '@/components/options/ConfirmDialog.vue'
import InstanceForm from '@/components/options/InstanceForm.vue'
import InstanceRow from '@/components/options/InstanceRow.vue'
import PageHeader from '@/components/options/PageHeader.vue'
import { Button } from '@/components/ui/button'
import { useExtensionState } from '@/composables/useExtensionState'
import { useSettings } from '@/composables/useSettings'
import { sendMessage } from '@/lib/messaging'
import { requestHostPermission } from '@/lib/permissions'
import { MAX_INSTANCES } from '@/lib/settings/defaults'
import type { Instance } from '@/lib/settings/schema'

const t = i18n.t
const route = useRoute()
const router = useRouter()
const { settings, save } = useSettings()
const { state } = useExtensionState()

const editingId = computed(() => {
  const id = route.params.id
  return typeof id === 'string' && id !== '' ? id : null
})
const editingInstance = computed(
  () => (editingId.value && settings.value?.instances.find((entry) => entry.id === editingId.value)) || null
)
// A first visit without any Pi-hole goes straight to the form.
const editorOpen = computed(() => editingId.value !== null || settings.value?.instances.length === 0)
const atLimit = computed(() => (settings.value?.instances.length ?? 0) >= MAX_INSTANCES)

// A stale deep link (instance removed meanwhile) falls back to the list.
watch([editingId, settings], ([id, current]) => {
  if (id && id !== 'new' && current && !current.instances.some((entry) => entry.id === id)) {
    void router.replace('/pi-holes')
  }
})

function statusOf(id: string) {
  return state.value?.instances.find((entry) => entry.id === id) ?? null
}

async function grant(entry: Instance): Promise<void> {
  const granted = await requestHostPermission(entry.url)
  if (granted) await sendMessage('refresh', undefined)
}

const pendingRemove = ref<Instance | null>(null)

function askRemove(entry: Instance): void {
  pendingRemove.value = entry
}

async function remove(): Promise<void> {
  const target = pendingRemove.value
  pendingRemove.value = null
  if (!target || !settings.value) return
  await save({ instances: settings.value.instances.filter((entry) => entry.id !== target.id) })
  if (editingId.value === target.id) await router.push('/pi-holes')
}
</script>
