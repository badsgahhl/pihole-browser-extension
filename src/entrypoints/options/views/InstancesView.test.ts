import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'

import { sendMessage } from '@/lib/messaging'
import { DEFAULT_SETTINGS } from '@/lib/settings/defaults'
import { mergeSettings, type Settings } from '@/lib/settings/schema'
import { settingsItem } from '@/lib/settings/storage'
import { instance } from '@/test/helpers'
import { instanceStatus, stateWith } from '@/test/state-builders'

import { routes } from '../router'
import InstancesView from './InstancesView.vue'

vi.mock('@/lib/messaging', () => ({ sendMessage: vi.fn() }))

const send = vi.mocked(sendMessage)
const home = instance('http://pi.hole', 'secret', { id: 'home', name: 'Home' })
const office = instance('https://office.example', 'secret', { id: 'office', name: 'Office' })

describe('InstancesView', () => {
  let router: Router
  let wrapper: ReturnType<typeof mount>

  beforeEach(async () => {
    send.mockReset()
    const settings = mergeSettings(DEFAULT_SETTINGS, { instances: [home, office] })
    await settingsItem.setValue(settings)
    send.mockImplementation((async (type: string, data: Partial<Settings>) => {
      if (type === 'getState') return stateWith(instanceStatus({ id: 'home', name: 'Home' }))
      if (type === 'saveSettings') return mergeSettings(settings, data)
      return undefined
    }) as never)
    router = createRouter({ history: createMemoryHistory(), routes })
    await router.push('/pi-holes')
    wrapper = mount(InstancesView, { global: { plugins: [router] }, attachTo: document.body })
    await flushPromises()
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('lists the instances and opens the editor for one of them', async () => {
    expect(wrapper.text()).toContain('Home')
    expect(wrapper.text()).toContain('https://office.example')
    await wrapper.get('[aria-label="options_instances_edit:Office"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/pi-holes/office')
    expect(wrapper.text()).toContain('options_instances_editing:Office')
  })

  it('removes an instance only after the dialog is confirmed', async () => {
    await wrapper.get('[aria-label="options_instances_remove:Home"]').trigger('click')
    await flushPromises()
    expect(send).not.toHaveBeenCalledWith('saveSettings', expect.anything())

    const dialog = document.body.querySelector('[role="alertdialog"]')
    expect(dialog?.textContent).toContain('options_instances_removeConfirm_title:Home')
    const confirm = [...dialog!.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'common_remove'
    )
    confirm!.click()
    await flushPromises()

    expect(send).toHaveBeenCalledWith('saveSettings', { instances: [office] })
  })
})
