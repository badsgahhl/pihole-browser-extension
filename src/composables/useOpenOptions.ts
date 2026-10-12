import { sendMessage } from '@/lib/messaging'

/** Opens the options page, optionally at a router path like `/pi-holes/new`, and closes the popup. */
export function useOpenOptions() {
  return async (path?: string) => {
    try {
      await sendMessage('openOptions', { path })
    } finally {
      window.close()
    }
  }
}
