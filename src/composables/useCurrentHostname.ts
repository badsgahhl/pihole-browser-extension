import { onMounted, ref } from 'vue'

import { sendMessage } from '@/lib/messaging'

/** Hostname of the tab the popup was opened on, or `null` for pages Pi-hole has no say in. */
export function useCurrentHostname() {
  const hostname = ref<string | null>(null)
  const resolved = ref(false)

  onMounted(async () => {
    try {
      hostname.value = await sendMessage('getCurrentTabHostname', undefined)
    } catch {
      hostname.value = null
    } finally {
      resolved.value = true
    }
  })

  return { hostname, resolved }
}
