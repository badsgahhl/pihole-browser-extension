import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import BaseSwitch from './BaseSwitch.vue'
import SegmentedControl from './SegmentedControl.vue'

describe('BaseSwitch', () => {
  it('is a real switch that emits the flipped value', async () => {
    const wrapper = mount(BaseSwitch, { props: { modelValue: false, label: 'Blocking' } })
    const button = wrapper.get('button')
    expect(button.attributes('role')).toBe('switch')
    expect(button.attributes('aria-checked')).toBe('false')
    expect(button.attributes('aria-label')).toBe('Blocking')
    await button.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
  })
})

describe('SegmentedControl', () => {
  it('renders radios and emits the picked value', async () => {
    const wrapper = mount(SegmentedControl, {
      props: {
        modelValue: 'state',
        label: 'Badge mode',
        options: [
          { value: 'off', label: 'Off' },
          { value: 'state', label: 'On / Off' },
          { value: 'percent', label: 'Blocked %' }
        ]
      }
    })
    const radios = wrapper.findAll('[role="radio"]')
    expect(radios).toHaveLength(3)
    expect(radios[1]!.attributes('aria-checked')).toBe('true')
    await radios[2]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['percent']])
  })
})
