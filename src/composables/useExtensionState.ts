import { inject, type InjectionKey, onBeforeUnmount, onMounted, provide, type ShallowRef, shallowRef } from 'vue'

import { sendMessage } from '@/lib/messaging'
import { EMPTY_STATE, type ExtensionState, stateItem } from '@/lib/state'

export interface ExtensionStateStore {
  state: ShallowRef<ExtensionState | null>
}

const KEY: InjectionKey<ExtensionStateStore> = Symbol('extension-state')

/**
 * The background's state, live. Asking the background once on mount also triggers a refresh when
 * the stored state is stale; every later update arrives through storage.
 */
function createStore(): ExtensionStateStore {
  const state: ShallowRef<ExtensionState | null> = shallowRef(null)
  let unwatch: (() => void) | undefined

  onMounted(async () => {
    unwatch = stateItem.watch((next) => {
      state.value = next ?? EMPTY_STATE
    })
    try {
      const reply = await sendMessage('getState', undefined)
      // The watcher may already have delivered something newer than the reply.
      if (!state.value || reply.lastRefreshAt >= state.value.lastRefreshAt) state.value = reply
    } catch {
      state.value ??= await stateItem.getValue()
    }
  })

  onBeforeUnmount(() => unwatch?.())

  return { state }
}

/** Creates the store once for a page tree, so views share one subscription and one request. */
export function provideExtensionState(): ExtensionStateStore {
  const store = createStore()
  provide(KEY, store)
  return store
}

/** The shared store when a parent provided one, otherwise a store of its own (popup, tests). */
export function useExtensionState(): ExtensionStateStore {
  return inject(KEY, null) ?? createStore()
}
