import { onBeforeUnmount, onMounted, type Ref, watchEffect } from 'vue'

import type { Theme } from '@/lib/settings/schema'

export const THEME_STORAGE_KEY = 'pihole-switch:theme'

function prefersDark(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function resolveTheme(theme: Theme | undefined, systemDark = prefersDark()): 'light' | 'dark' {
  if (theme === 'dark' || theme === 'light') return theme
  return systemDark ? 'dark' : 'light'
}

/**
 * Applies the theme setting to `<html>`: the `dark` class for Tailwind and `color-scheme` for form
 * controls. The choice is mirrored into localStorage so `theme-init.js` can apply it before Vue runs.
 */
export function useTheme(theme: Ref<Theme | undefined>) {
  const media = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: dark)') : null
  let systemDark = media?.matches ?? false

  function apply() {
    const resolved = resolveTheme(theme.value, systemDark)
    document.documentElement.classList.toggle('dark', resolved === 'dark')
    document.documentElement.style.colorScheme = resolved
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme.value ?? 'system')
    } catch {
      // Storage may be unavailable; the next open just starts from the system theme.
    }
  }

  function onMediaChange(event: MediaQueryListEvent) {
    systemDark = event.matches
    apply()
  }

  watchEffect(apply)
  onMounted(() => media?.addEventListener('change', onMediaChange))
  onBeforeUnmount(() => media?.removeEventListener('change', onMediaChange))
}
