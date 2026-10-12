import { onBeforeUnmount, onMounted, shallowRef } from 'vue'

import { sendMessage } from '@/lib/messaging'
import { DEFAULT_SETTINGS } from '@/lib/settings/defaults'
import type { Settings } from '@/lib/settings/schema'
import { readSettings, settingsItem } from '@/lib/settings/storage'

/** Settings, live. Writes go through the background so side effects (logout, menus) happen there. */
export function useSettings() {
  const settings = shallowRef<Settings | null>(null)
  let unwatch: (() => void) | undefined

  onMounted(async () => {
    unwatch = settingsItem.watch((next) => {
      settings.value = next ?? DEFAULT_SETTINGS
    })
    settings.value = await readSettings()
  })

  onBeforeUnmount(() => unwatch?.())

  async function save(partial: Partial<Settings>): Promise<Settings> {
    const next = await sendMessage('saveSettings', partial)
    settings.value = next
    return next
  }

  return { settings, save }
}
