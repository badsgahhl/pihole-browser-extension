import { onBeforeUnmount, onMounted, shallowRef } from 'vue'

import { sendMessage } from '@/lib/messaging'
import { EMPTY_STATE, type ExtensionState, stateItem } from '@/lib/state'

/**
 * The background's state, live. Asking the background once on mount also triggers a refresh when
 * the stored state is stale; every later update arrives through storage.
 */
export function useExtensionState() {
  const state = shallowRef<ExtensionState | null>(null)
  let unwatch: (() => void) | undefined

  onMounted(async () => {
    unwatch = stateItem.watch((next) => {
      state.value = next ?? EMPTY_STATE
    })
    try {
      state.value = await sendMessage('getState', undefined)
    } catch {
      state.value = await stateItem.getValue()
    }
  })

  onBeforeUnmount(() => unwatch?.())

  return { state }
}
