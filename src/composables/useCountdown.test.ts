import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'

import { useCountdown } from './useCountdown'

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-12T08:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function mountWith(endsAt: number | null) {
    const ends = ref(endsAt)
    const Host = defineComponent({
      setup() {
        const countdown = useCountdown(ends)
        return () => h('div', `${countdown.text.value}|${countdown.expired.value}`)
      }
    })
    return { wrapper: mount(Host), ends }
  }

  it('ticks once a second and reports expiry', async () => {
    const { wrapper } = mountWith(Date.now() + 272_000)
    expect(wrapper.text()).toBe('04:32|false')
    // useTimeoutPoll arms the next tick after an await, so the timers advance asynchronously.
    await vi.advanceTimersByTimeAsync(1000)
    expect(wrapper.text()).toBe('04:31|false')
    await vi.advanceTimersByTimeAsync(272_000)
    expect(wrapper.text()).toBe('00:00|true')
  })

  it('shows hours and stays idle without a timer', async () => {
    const { wrapper, ends } = mountWith(null)
    expect(wrapper.text()).toBe('|false')
    expect(vi.getTimerCount()).toBe(0)
    ends.value = Date.now() + 2 * 3_600_000
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toBe('2:00:00|false')
    expect(vi.getTimerCount()).toBe(1)
  })

  it('clears its interval on unmount', () => {
    const { wrapper } = mountWith(Date.now() + 60_000)
    expect(vi.getTimerCount()).toBe(1)
    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
