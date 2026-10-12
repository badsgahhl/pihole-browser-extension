import { ref } from 'vue'

import { errorDataFrom } from '@/lib/error-messages'
import { sendMessage } from '@/lib/messaging'
import type { ActionResult } from '@/lib/pihole/actions'
import type { PiholeErrorData } from '@/lib/pihole/errors'

export type PendingAction = 'toggle' | 'pause' | 'resume' | 'extend' | 'refresh' | null

/** Blocking actions with a pending flag and the first error for the card to show. */
export function useActions() {
  const pending = ref<PendingAction>(null)
  const error = ref<PiholeErrorData | null>(null)

  async function run(kind: PendingAction, task: () => Promise<ActionResult | unknown>): Promise<void> {
    if (pending.value) return
    pending.value = kind
    error.value = null
    try {
      const result = await task()
      if (isActionResult(result) && !result.ok) {
        error.value = result.perInstance.find((entry) => entry.error)?.error ?? null
      }
    } catch (caught) {
      error.value = errorDataFrom(caught)
    } finally {
      pending.value = null
    }
  }

  return {
    pending,
    error,
    toggle: () => run('toggle', () => sendMessage('toggle', undefined)),
    pause: (seconds: number | null) => run('pause', () => sendMessage('setBlocking', { enabled: false, seconds })),
    resume: () => run('resume', () => sendMessage('setBlocking', { enabled: true })),
    extend: (seconds: number) => run('extend', () => sendMessage('extendPause', { seconds })),
    refresh: () => run('refresh', () => sendMessage('refresh', undefined))
  }
}

function isActionResult(value: unknown): value is ActionResult {
  return typeof value === 'object' && value !== null && 'perInstance' in value && 'ok' in value
}
