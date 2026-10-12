import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { sendMessage } from '@/lib/messaging'
import { mountComposable } from '@/test/mount-composable'
import { instanceStatus, stateWith } from '@/test/state-builders'

import { useActions } from './useActions'

vi.mock('@/lib/messaging', () => ({ sendMessage: vi.fn() }))

const send = vi.mocked(sendMessage)

describe('useActions', () => {
  beforeEach(() => {
    send.mockReset()
  })

  it('sends the blocking messages and clears pending afterwards', async () => {
    send.mockResolvedValue({ ok: true, perInstance: [], state: stateWith(instanceStatus()) } as never)
    const { result } = mountComposable(() => useActions())

    const call = result.pause(300)
    expect(result.pending.value).toBe('pause')
    await call
    expect(result.pending.value).toBeNull()
    expect(send).toHaveBeenCalledWith('setBlocking', { enabled: false, seconds: 300 })

    await result.resume()
    await result.extend(3600)
    await result.toggle()
    expect(send).toHaveBeenCalledWith('setBlocking', { enabled: true })
    expect(send).toHaveBeenCalledWith('extendPause', { seconds: 3600 })
    expect(send).toHaveBeenCalledWith('toggle', undefined)
  })

  it('ignores a second action while one is pending', async () => {
    send.mockImplementation((() => new Promise(() => undefined)) as never)
    const { result } = mountComposable(() => useActions())
    void result.pause(10)
    void result.toggle()
    await flushPromises()
    expect(send).toHaveBeenCalledTimes(1)
  })

  it('surfaces the first failing Pi-hole of a partial result, and a thrown error', async () => {
    send.mockResolvedValue({
      ok: false,
      perInstance: [
        { id: 'home', ok: true },
        { id: 'office', ok: false, error: { kind: 'unreachable', message: 'x', instanceId: 'office' } }
      ],
      state: stateWith(instanceStatus())
    } as never)
    const { result } = mountComposable(() => useActions())
    await result.toggle()
    expect(result.error.value).toMatchObject({ kind: 'unreachable', instanceId: 'office' })

    send.mockRejectedValue(new Error('port closed'))
    await result.refresh()
    expect(result.error.value).toMatchObject({ kind: 'unknown', message: 'port closed' })
  })
})
