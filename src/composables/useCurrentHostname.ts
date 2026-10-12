import { onMounted, shallowRef } from 'vue'

import { sendMessage } from '@/lib/messaging'

/** Hostname of the tab the popup was opened on, or `null` for pages Pi-hole has no say in. */
export function useCurrentHostname() {
  const hostname = shallowRef<string | null>(null)

  onMounted(async () => {
    try {
      hostname.value = await sendMessage('getCurrentTabHostname', undefined)
    } catch {
      hostname.value = null
    }
  })

  return { hostname }
}
