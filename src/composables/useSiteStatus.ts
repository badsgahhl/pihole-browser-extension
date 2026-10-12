import { type MaybeRefOrGetter, shallowRef, toValue, watch } from 'vue'

import { errorDataFrom } from '@/lib/error-messages'
import { sendMessage } from '@/lib/messaging'
import type { PiholeErrorData } from '@/lib/pihole/errors'
import type { ListType, SiteMutationResult, SiteStatus } from '@/lib/pihole/site-status'

/** What the Pi-holes do with the current tab's domain, plus the allow and deny actions. */
export function useSiteStatus(hostname: MaybeRefOrGetter<string | null>) {
  const site = shallowRef<SiteStatus | null>(null)
  const loading = shallowRef(false)
  const acting = shallowRef(false)
  const error = shallowRef<PiholeErrorData | null>(null)

  /** An answer only counts while the popup is still on the host it was asked for. */
  const current = (host: string) => toValue(hostname) === host

  async function load(fresh = false): Promise<void> {
    const host = toValue(hostname)
    if (!host) {
      site.value = null
      return
    }
    loading.value = true
    error.value = null
    try {
      const status = await sendMessage('getSiteStatus', { hostname: host, fresh })
      if (current(host)) site.value = status
    } catch (caught) {
      if (current(host)) error.value = errorDataFrom(caught)
    } finally {
      if (current(host)) loading.value = false
    }
  }

  async function mutate(task: (host: string) => Promise<SiteMutationResult>): Promise<void> {
    const host = toValue(hostname)
    if (!host || acting.value) return
    acting.value = true
    error.value = null
    try {
      const result = await task(host)
      if (!current(host)) return
      site.value = result.status
      if (!result.ok) error.value = result.perInstance.find((entry) => entry.error)?.error ?? null
    } catch (caught) {
      if (current(host)) error.value = errorDataFrom(caught)
    } finally {
      acting.value = false
    }
  }

  watch(
    () => toValue(hostname),
    () => void load(),
    { immediate: true }
  )

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
