import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { instanceStatus } from '@/test/state-builders'

import PopupHeader from './PopupHeader.vue'

describe('PopupHeader', () => {
  it('shows the title next to a single Pi-hole', () => {
    const wrapper = mount(PopupHeader, { props: { instances: [instanceStatus({ id: 'a', name: 'Home' })] } })
    expect(wrapper.get('h1').classes()).not.toContain('sr-only')
  })

  it('leaves the room to the chips from two Pi-holes on and keeps the heading for screen readers', () => {
    const instances = [instanceStatus({ id: 'a', name: 'localhost' }), instanceStatus({ id: 'b', name: 'Portainer' })]
    const wrapper = mount(PopupHeader, { props: { instances } })
    expect(wrapper.get('h1').classes()).toContain('sr-only')
    expect(wrapper.get('h1').text()).toBe('popup_title')
  })
})
