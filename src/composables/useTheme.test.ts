import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, ref } from 'vue'

import type { Theme } from '@/lib/settings/schema'

import { resolveTheme, THEME_STORAGE_KEY, useTheme } from './useTheme'

describe('resolveTheme', () => {
  it('follows the system unless fixed', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
    expect(resolveTheme(undefined, true)).toBe('dark')
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })
})

describe('useTheme', () => {
  afterEach(() => {
    document.documentElement.classList.remove('dark')
    localStorage.clear()
  })

  it('applies the class, the colour scheme and the localStorage mirror', async () => {
    const theme = ref<Theme | undefined>('dark')
    const Host = defineComponent({
      setup() {
        useTheme(theme)
        return () => h('div')
      }
    })
    const wrapper = mount(Host)

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.style.colorScheme).toBe('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')

    theme.value = 'light'
    await wrapper.vm.$nextTick()
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
  })
})
