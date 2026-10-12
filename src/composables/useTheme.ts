import { useColorMode } from '@vueuse/core'
import { type MaybeRefOrGetter, toValue, watchEffect } from 'vue'

import type { Theme } from '@/lib/settings/schema'

/** Mirror of the theme choice for `theme-init.js`, which applies it before Vue runs. */
export const THEME_STORAGE_KEY = 'pihole-switch:theme'

export function resolveTheme(theme: Theme | undefined, systemDark: boolean): 'light' | 'dark' {
  if (theme === 'dark' || theme === 'light') return theme
  return systemDark ? 'dark' : 'light'
}

/**
 * Applies the theme setting to `<html>`: the `dark` class for Tailwind and `color-scheme` for form
 * controls. VueUse's `useColorMode` follows the system for `auto`, keeps the choice in localStorage
 * and starts from that stored choice, so nothing flashes while the settings are still loading.
 */
export function useTheme(theme: MaybeRefOrGetter<Theme | undefined>) {
  const mode = useColorMode({
    storageKey: THEME_STORAGE_KEY,
    emitAuto: true,
    // Each page sets its own mode from the settings; cross-tab storage events are not needed.
    listenToStorageChanges: false,
    onChanged(resolved, defaultHandler) {
      defaultHandler(resolved)
      document.documentElement.style.colorScheme = resolved
    }
  })

  watchEffect(() => {
    const choice = toValue(theme)
    if (choice === undefined) return
    mode.value = choice === 'system' ? 'auto' : choice
  })

  return mode
}
