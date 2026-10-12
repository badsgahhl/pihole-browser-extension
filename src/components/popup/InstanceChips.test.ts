import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { instanceStatus } from '@/test/state-builders'

import InstanceChips from './InstanceChips.vue'

describe('InstanceChips', () => {
  it('renders one chip per instance up to three', async () => {
    const wrapper = mount(InstanceChips, {
      props: {
        instances: [
          instanceStatus({ id: 'a', name: 'Home' }),
          instanceStatus({ id: 'b', name: 'Office', blocking: 'disabled' }),
          instanceStatus({ id: 'c', name: 'Garage', blocking: null, error: { kind: 'unreachable', message: 'x' } })
        ]
      }
    })
    const chips = wrapper.findAll('button')
    expect(chips).toHaveLength(3)
    expect(chips.map((chip) => chip.text())).toEqual(['Home', 'Office', 'Garage'])
    expect(chips[2]!.attributes('title')).toContain('status_unreachable')
    await chips[1]!.trigger('click')
    expect(wrapper.emitted('open')).toEqual([['b']])
  })

  it('collapses more than three instances into one chip with dots and a count', () => {
    const wrapper = mount(InstanceChips, {
      props: { instances: ['a', 'b', 'c', 'd'].map((id) => instanceStatus({ id, name: id.toUpperCase() })) }
    })
    const chips = wrapper.findAll('button')
    expect(chips).toHaveLength(1)
    expect(chips[0]!.text()).toBe('4')
    expect(chips[0]!.findAll('span[aria-hidden="true"]')).toHaveLength(4)
    expect(chips[0]!.attributes('title')).toContain('popup_moreInstances:4')
  })
})
