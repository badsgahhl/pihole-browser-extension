import { inject, type InjectionKey, onBeforeUnmount, onMounted, provide, type ShallowRef, shallowRef } from 'vue'

import { sendMessage } from '@/lib/messaging'
import { DEFAULT_SETTINGS } from '@/lib/settings/defaults'
import type { Settings } from '@/lib/settings/schema'
import { readSettings, settingsItem } from '@/lib/settings/storage'

export interface SettingsStore {
  settings: ShallowRef<Settings | null>
  /** Writes go through the background so side effects (logout, menus, refresh) happen there. */
  save: (partial: Partial<Settings>) => Promise<Settings>
}

const KEY: InjectionKey<SettingsStore> = Symbol('settings')

function createStore(): SettingsStore {
  const settings: ShallowRef<Settings | null> = shallowRef(null)
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

/** Creates the store once for a page tree, so views share one subscription and one read. */
export function provideSettings(): SettingsStore {
  const store = createStore()
  provide(KEY, store)
  return store
}

/** The shared store when a parent provided one, otherwise a store of its own (popup, tests). */
export function useSettings(): SettingsStore {
  return inject(KEY, null) ?? createStore()
}
