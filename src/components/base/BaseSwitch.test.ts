import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import BaseSwitch from './BaseSwitch.vue'

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
