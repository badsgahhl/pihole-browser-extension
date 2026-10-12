import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { sendMessage } from '@/lib/messaging'

import DataActions from './DataActions.vue'

vi.mock('@/lib/messaging', () => ({ sendMessage: vi.fn() }))

const send = vi.mocked(sendMessage)

/** The dialog renders through a portal, so it is looked up on the document. */
function dialogButton(label: string): HTMLButtonElement {
  const dialog = document.body.querySelector('[role="alertdialog"]')
  if (!dialog) throw new Error('no dialog open')
  const button = [...dialog.querySelectorAll('button')].find((candidate) => candidate.textContent?.trim() === label)
  if (!button) throw new Error(`no "${label}" button in the dialog`)
  return button
}

describe('DataActions', () => {
  let wrapper: ReturnType<typeof mount>

  beforeEach(() => {
    send.mockReset()
    send.mockImplementation((async () => ({})) as never)
    wrapper = mount(DataActions, { attachTo: document.body })
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('resets only after the dialog is confirmed', async () => {
    const buttons = wrapper.findAll('button')
    await buttons.find((button) => button.text() === 'options_general_reset')!.trigger('click')
    await flushPromises()
    expect(send).not.toHaveBeenCalled()

    dialogButton('options_general_reset').click()
    await flushPromises()
    expect(send).toHaveBeenCalledWith('resetSettings', undefined)
  })

  it('imports the chosen file after confirming, and reports an invalid file', async () => {
    const input = wrapper.get('input[type="file"]')
    const file = new File(['{"app":"x"}'], 'settings.json', { type: 'application/json' })
    Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
    await input.trigger('change')
    await flushPromises()
    expect(send).not.toHaveBeenCalled()

    send.mockImplementation((async () => {
      throw new Error('not an export')
    }) as never)
    dialogButton('options_general_import').click()
    await flushPromises()
    expect(send).toHaveBeenCalledWith('importSettings', { json: '{"app":"x"}' })
    expect(wrapper.get('[role="alert"]').text()).toBe('options_general_importInvalid')
  })
})
