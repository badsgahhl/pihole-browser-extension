import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

import { useHotkeys } from './useHotkeys'

function press(key: string, init: KeyboardEventInit = {}, target: EventTarget = document.body) {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }))
}

describe('useHotkeys', () => {
  it('runs the handler for a plain key, ignoring modifiers, repeats and fields', () => {
    const toggle = vi.fn()
    const Host = defineComponent({
      setup() {
        useHotkeys({ t: toggle })
        return () => h('div', [h('input', { id: 'field' })])
      }
    })
    const wrapper = mount(Host, { attachTo: document.body })

    press('T')
    expect(toggle).toHaveBeenCalledTimes(1)
    press('t', { ctrlKey: true })
    press('t', { metaKey: true })
    press('t', { altKey: true })
    press('t', { repeat: true })
    expect(toggle).toHaveBeenCalledTimes(1)

    press('t', {}, wrapper.get('#field').element)
    expect(toggle).toHaveBeenCalledTimes(1)

    wrapper.unmount()
    press('t')
    expect(toggle).toHaveBeenCalledTimes(1)
  })
})
