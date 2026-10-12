import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { sendMessage } from '@/lib/messaging'
import { DEFAULT_SETTINGS } from '@/lib/settings/defaults'
import { mergeSettings, type Settings } from '@/lib/settings/schema'
import { settingsItem } from '@/lib/settings/storage'

import GeneralView from './GeneralView.vue'

vi.mock('@/lib/messaging', () => ({ sendMessage: vi.fn() }))

const send = vi.mocked(sendMessage)

async function mountView(): Promise<ReturnType<typeof mount>> {
  await settingsItem.setValue(DEFAULT_SETTINGS)
  send.mockImplementation((async (type: string, data: Partial<Settings>) => {
    if (type === 'saveSettings') return mergeSettings(DEFAULT_SETTINGS, data)
    return undefined
  }) as never)
  const wrapper = mount(GeneralView)
  await flushPromises()
  return wrapper
}

describe('GeneralView', () => {
  beforeEach(() => {
    send.mockReset()
  })

  it('saves a switch change immediately with the rest of the pause settings intact', async () => {
    const wrapper = await mountView()
    const switches = wrapper.findAll('[role="switch"]')
    expect(switches).toHaveLength(5)
    await switches[0]!.trigger('click')
    await flushPromises()
    expect(send).toHaveBeenCalledWith('saveSettings', { pause: { defaultSeconds: 300, rememberLast: false } })
  })

  it('saves the badge mode and the theme from the segmented controls', async () => {
    const wrapper = await mountView()
    const radios = wrapper.findAll('[role="radio"]')
    await radios.find((radio) => radio.text() === 'options_general_badge_percent')!.trigger('click')
    await radios.find((radio) => radio.text() === 'options_general_theme_dark')!.trigger('click')
    await flushPromises()
    expect(send).toHaveBeenCalledWith('saveSettings', { badgeMode: 'percent' })
    expect(send).toHaveBeenCalledWith('saveSettings', { theme: 'dark' })
  })

  it('saves the default pause duration in seconds', async () => {
    const wrapper = await mountView()
    const amount = wrapper.get('#pause-default')
    await amount.setValue('10')
    await amount.trigger('change')
    await flushPromises()
    expect(send).toHaveBeenCalledWith('saveSettings', { pause: { defaultSeconds: 600, rememberLast: true } })
  })
})
