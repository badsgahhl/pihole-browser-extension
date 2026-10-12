import { type Ref, ref, watch } from 'vue'

import { errorDataFrom } from '@/lib/error-messages'
import { sendMessage } from '@/lib/messaging'
import type { PiholeErrorData } from '@/lib/pihole/errors'
import type { ListType, SiteMutationResult, SiteStatus } from '@/lib/pihole/site-status'

/** What the Pi-holes do with the current tab's domain, plus the allow and deny actions. */
export function useSiteStatus(hostname: Ref<string | null>) {
  const site = ref<SiteStatus | null>(null)
  const loading = ref(false)
  const acting = ref(false)
  const error = ref<PiholeErrorData | null>(null)

  async function load(fresh = false): Promise<void> {
    const host = hostname.value
    if (!host) {
      site.value = null
      return
    }
    loading.value = true
    error.value = null
    try {
      const status = await sendMessage('getSiteStatus', { hostname: host, fresh })
      if (hostname.value === host) site.value = status
    } catch (caught) {
      error.value = errorDataFrom(caught)
    } finally {
      loading.value = false
    }
  }

  async function mutate(task: (host: string) => Promise<SiteMutationResult>): Promise<void> {
    const host = hostname.value
    if (!host || acting.value) return
    acting.value = true
    error.value = null
    try {
      const result = await task(host)
      site.value = result.status
      if (!result.ok) error.value = result.perInstance.find((entry) => entry.error)?.error ?? null
    } catch (caught) {
      error.value = errorDataFrom(caught)
    } finally {
      acting.value = false
    }
  }

  watch(hostname, () => void load(), { immediate: true })

  return {
    site,
    loading,
    acting,
    error,
    reload: () => load(true),
    allow: () => mutate((host) => sendMessage('allowDomain', { hostname: host })),
    deny: () => mutate((host) => sendMessage('denyDomain', { hostname: host })),
    remove: (list: ListType) => mutate((host) => sendMessage('removeDomain', { hostname: host, list })),
    tempAllow: (minutes?: number) => mutate((host) => sendMessage('tempAllow', { hostname: host, minutes }))
  }
}
