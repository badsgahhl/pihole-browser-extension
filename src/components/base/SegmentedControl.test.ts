import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SegmentedControl from './SegmentedControl.vue'

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
