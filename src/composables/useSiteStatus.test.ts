import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { sendMessage } from '@/lib/messaging'
import type { SiteStatus } from '@/lib/pihole/site-status'
import { mountComposable } from '@/test/mount-composable'

import { useSiteStatus } from './useSiteStatus'

vi.mock('@/lib/messaging', () => ({ sendMessage: vi.fn() }))

const send = vi.mocked(sendMessage)

function status(hostname: string, verdict: SiteStatus['verdict'] = 'not-blocked'): SiteStatus {
  return { hostname, verdict, listName: null, ownEntry: null, tempUntil: null, perInstance: [], checkedAt: Date.now() }
}

describe('useSiteStatus', () => {
  beforeEach(() => {
    send.mockReset()
  })

  it('looks the host up when it becomes known and keeps nothing for pages without one', async () => {
    send.mockImplementation((async (_type: string, data: { hostname: string }) => status(data.hostname)) as never)
    const hostname = ref<string | null>(null)
    const { result } = mountComposable(() => useSiteStatus(hostname))
    await flushPromises()
    expect(send).not.toHaveBeenCalled()
    expect(result.site.value).toBeNull()

    hostname.value = 'ads.example.com'
    await flushPromises()
    expect(send).toHaveBeenCalledWith('getSiteStatus', { hostname: 'ads.example.com', fresh: false })
    expect(result.site.value?.hostname).toBe('ads.example.com')
    expect(result.loading.value).toBe(false)
  })

  it('drops an answer for a host the popup has moved away from', async () => {
    let resolveFirst!: (value: SiteStatus) => void
    send.mockImplementationOnce((() => new Promise<SiteStatus>((resolve) => (resolveFirst = resolve))) as never)
    send.mockImplementationOnce((async () => status('second.example')) as never)
    const hostname = ref<string | null>('first.example')
    const { result } = mountComposable(() => useSiteStatus(hostname))
    hostname.value = 'second.example'
    await flushPromises()
    resolveFirst(status('first.example', 'blocked-list'))
    await flushPromises()
    expect(result.site.value?.hostname).toBe('second.example')
  })

  it('applies the status a mutation returns and shows the failing Pi-hole', async () => {
    send.mockImplementationOnce((async () => status('x.example')) as never)
    send.mockImplementationOnce((async () => ({
      ok: false,
      perInstance: [
        { id: 'office', ok: false, error: { kind: 'bad_request', message: 'locked', instanceId: 'office' } }
      ],
      status: status('x.example', 'allowed-own')
    })) as never)
    const { result } = mountComposable(() => useSiteStatus(ref('x.example')))
    await flushPromises()
    await result.allow()
    expect(send).toHaveBeenCalledWith('allowDomain', { hostname: 'x.example' })
    expect(result.site.value?.verdict).toBe('allowed-own')
    expect(result.error.value).toMatchObject({ kind: 'bad_request', instanceId: 'office' })
    expect(result.acting.value).toBe(false)
  })
})
