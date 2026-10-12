import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { instanceStatus, stateWith } from '@/test/state-builders'

import BlockingCard from './BlockingCard.vue'

describe('BlockingCard', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-12T08:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows the active state with stats and the presets', () => {
    const state = stateWith(
      instanceStatus({ id: 'home', stats: { queries: 10, blocked: 4, percentBlocked: 38.4, clients: 24 }, statsAt: 1 }),
      instanceStatus({ id: 'office' })
    )
    const wrapper = mount(BlockingCard, { props: { state } })

    expect(wrapper.text()).toContain('popup_blocking_active')
    expect(wrapper.text()).toContain('24')
    expect(wrapper.text()).toContain('38 %')
    expect(wrapper.get('[role="switch"]').attributes('aria-checked')).toBe('true')
    expect(wrapper.findAll('[aria-keyshortcuts]')).toHaveLength(6)
    expect(wrapper.find('[aria-label="popup_blocking_custom"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('popup_blocking_disableAllFor')
  })

  it('emits toggle from the switch and pause from a preset', async () => {
    const wrapper = mount(BlockingCard, { props: { state: stateWith(instanceStatus()) } })
    await wrapper.get('[role="switch"]').trigger('click')
    expect(wrapper.emitted('toggle')).toHaveLength(1)

    const presets = wrapper.findAll('[aria-keyshortcuts]')
    await presets[2]!.trigger('click')
    expect(wrapper.emitted('pause')).toEqual([[300]])
    await presets[5]!.trigger('click')
    expect(wrapper.emitted('pause')).toEqual([[300], [null]])
  })

  it('shows the countdown and the resume row while paused', async () => {
    const state = stateWith(instanceStatus({ blocking: 'disabled', timerEndsAt: Date.now() + 272_000 }))
    const wrapper = mount(BlockingCard, { props: { state } })

    expect(wrapper.text()).toContain('popup_blocking_paused')
    expect(wrapper.text()).toContain('04:32')
    expect(wrapper.get('[role="switch"]').attributes('aria-checked')).toBe('false')
    expect(wrapper.text()).toContain('popup_blocking_enableNow')

    vi.advanceTimersByTime(1000)
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('04:31')

    const byText = (text: string) => wrapper.findAll('button').find((button) => button.text() === text)!
    await byText('popup_blocking_enableNow').trigger('click')
    expect(wrapper.emitted('resume')).toHaveLength(1)
    await byText('popup_blocking_extend5').trigger('click')
    expect(wrapper.emitted('extend')).toEqual([[300]])
  })

  it('names the unreachable sibling and disables the switch when nothing answers', () => {
    const degraded = stateWith(
      instanceStatus({ id: 'home', name: 'Home' }),
      instanceStatus({ id: 'office', name: 'Office', blocking: null, error: { kind: 'unreachable', message: 'x' } })
    )
    const wrapper = mount(BlockingCard, { props: { state: degraded } })
    expect(wrapper.text()).toContain('popup_blocking_onlyOne:Office,Home')

    const down = stateWith(instanceStatus({ blocking: null, error: { kind: 'unreachable', message: 'x' } }))
    const wrapper2 = mount(BlockingCard, { props: { state: down } })
    expect(wrapper2.text()).toContain('popup_blocking_unreachable')
    expect(wrapper2.get('[role="switch"]').attributes('disabled')).toBeDefined()
  })

  it('offers retry and settings instead of presets when the password is wrong', async () => {
    const down = stateWith(instanceStatus({ blocking: null, error: { kind: 'unauthorized', message: 'x' } }))
    const wrapper = mount(BlockingCard, { props: { state: down } })
    expect(wrapper.text()).toContain('popup_blocking_actionNeeded')
    expect(wrapper.text()).not.toContain('popup_blocking_disableAllFor')
    const buttons = wrapper.findAll('button').filter((button) => button.attributes('role') !== 'switch')
    expect(buttons.map((button) => button.text())).toEqual(['common_retry', 'popup_error_openSettings'])
    await buttons[0]!.trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
    await buttons[1]!.trigger('click')
    expect(wrapper.emitted('openSettings')).toHaveLength(1)
  })

  it('renders an error with a retry link', async () => {
    const wrapper = mount(BlockingCard, {
      props: { state: stateWith(instanceStatus()), error: { kind: 'timeout', message: 'slow' } }
    })
    const alert = wrapper.get('[role="alert"]')
    expect(alert.text()).toContain('errors_timeout')
    await alert.get('button').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })
})
