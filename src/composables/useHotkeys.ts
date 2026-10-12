import { useEventListener } from '@vueuse/core'

export type HotkeyMap = Record<string, () => void>

const EDITABLE = 'input, textarea, select, [contenteditable], [role="dialog"]'

/**
 * Single-key shortcuts inside a page. Keys are compared lowercase; typing in a field, holding a
 * modifier or holding the key down never triggers them.
 */
export function useHotkeys(map: HotkeyMap) {
  useEventListener(document, 'keydown', (event: KeyboardEvent) => {
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return
    const target = event.target as Element | null
    if (target?.closest?.(EDITABLE)) return
    const handler = map[event.key.toLowerCase()]
    if (!handler) return
    event.preventDefault()
    handler()
  })
}
