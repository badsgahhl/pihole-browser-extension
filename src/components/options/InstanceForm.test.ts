import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { sendMessage } from '@/lib/messaging'
import type { InstanceTestResult } from '@/lib/pihole/actions'
import { instance, permissionsMock } from '@/test/helpers'

import InstanceForm from './InstanceForm.vue'

vi.mock('@/lib/messaging', () => ({ sendMessage: vi.fn() }))

const send = vi.mocked(sendMessage)

const CONNECTED: InstanceTestResult = {
  ok: true,
  reachable: true,
  auth: 'ok',
  versions: { core: 'v6.4.2', web: 'v6.5', ftl: 'v6.6.1', docker: null, updateAvailable: false }
}

/** Records the order of browser and background calls the save flow makes. */
function recordCalls(testResult: InstanceTestResult = CONNECTED, granted = true) {
  const calls: string[] = []
  permissionsMock().request.mockImplementation(async () => {
    calls.push('permissions.request')
    return granted
  })
  send.mockImplementation((async (type: string) => {
    calls.push(type)
    if (type === 'testInstance') return testResult
    if (type === 'saveSettings') return {}
    return undefined
  }) as never)
  return calls
}

async function fill(wrapper: ReturnType<typeof mount>, values: { name?: string; url?: string; password?: string }) {
  if (values.name !== undefined) await wrapper.get('#instance-name').setValue(values.name)
  if (values.url !== undefined) await wrapper.get('#instance-url').setValue(values.url)
  if (values.password !== undefined) await wrapper.get('#instance-password').setValue(values.password)
}

async function submit(wrapper: ReturnType<typeof mount>) {
  await wrapper.get('form').trigger('submit')
  await flushPromises()
}

describe('InstanceForm', () => {
  beforeEach(() => {
    send.mockReset()
  })

  it('asks for the origin, tests the login and saves, in that order', async () => {
    const calls = recordCalls()
    const wrapper = mount(InstanceForm, { props: { instance: null, instances: [], status: null } })
    await fill(wrapper, { name: ' Home ', url: 'pi.hole:8080/admin', password: 'secret' })
    await submit(wrapper)

    expect(calls).toEqual(['permissions.request', 'testInstance', 'saveSettings'])
    expect(permissionsMock().request).toHaveBeenCalledWith({ origins: ['http://pi.hole:8080/*'] })
    expect(send).toHaveBeenCalledWith('testInstance', { url: 'http://pi.hole:8080', password: 'secret' })
    const saved = send.mock.calls.find((call) => call[0] === 'saveSettings')?.[1] as {
      instances: { id: string; name: string; url: string; password: string }[]
    }
    expect(saved.instances).toHaveLength(1)
    expect(saved.instances[0]).toMatchObject({ name: 'Home', url: 'http://pi.hole:8080', password: 'secret' })
    expect(saved.instances[0]!.id).toBeTruthy()
    expect(wrapper.emitted('saved')).toHaveLength(1)
    expect(wrapper.text()).toContain('options_instances_connected')
    expect(wrapper.text()).toContain('Core 6.4.2')
  })

  it('keeps the other instances and replaces the edited one in place', async () => {
    recordCalls()
    const home = instance('http://pi.hole', 'old', { id: 'home', name: 'Home' })
    const office = instance('https://office.example', 'x', { id: 'office', name: 'Office' })
    const wrapper = mount(InstanceForm, { props: { instance: home, instances: [home, office], status: null } })
    await fill(wrapper, { password: 'new' })
    await submit(wrapper)

    const saved = send.mock.calls.find((call) => call[0] === 'saveSettings')?.[1] as { instances: unknown[] }
    expect(saved.instances).toEqual([{ ...home, password: 'new' }, office])
  })

  it('stops when the browser refuses the origin', async () => {
    const calls = recordCalls(CONNECTED, false)
    const wrapper = mount(InstanceForm, { props: { instance: null, instances: [], status: null } })
    await fill(wrapper, { name: 'Home', url: 'http://pi.hole', password: '' })
    await submit(wrapper)

    expect(calls).toEqual(['permissions.request'])
    expect(wrapper.text()).toContain('options_instances_accessDenied:pi.hole')
    expect(wrapper.emitted('saved')).toBeUndefined()
  })

  it('shows the login error and does not save when the test fails', async () => {
    const calls = recordCalls({
      ok: false,
      reachable: true,
      auth: 'failed',
      error: { kind: 'unauthorized', message: 'nope' }
    })
    const wrapper = mount(InstanceForm, { props: { instance: null, instances: [], status: null } })
    await fill(wrapper, { name: 'Home', url: 'http://pi.hole', password: 'wrong' })
    await submit(wrapper)

    expect(calls).toEqual(['permissions.request', 'testInstance'])
    expect(wrapper.get('[role="alert"]').text()).toBe('errors_unauthorized')
    expect(wrapper.emitted('saved')).toBeUndefined()
  })

  it('validates before touching the browser', async () => {
    const calls = recordCalls()
    const home = instance('http://pi.hole', 'x', { id: 'home' })
    const wrapper = mount(InstanceForm, { props: { instance: null, instances: [home], status: null } })
    await fill(wrapper, { name: '', url: 'PI.HOLE/' })
    await submit(wrapper)

    expect(calls).toEqual([])
    const alerts = wrapper.findAll('[role="alert"]').map((alert) => alert.text())
    expect(alerts).toEqual(['errors_name_required', 'errors_duplicate_instance'])
    expect(wrapper.get('#instance-name').attributes('aria-invalid')).toBe('true')
  })

  it('tests the connection without saving', async () => {
    const calls = recordCalls()
    const wrapper = mount(InstanceForm, { props: { instance: null, instances: [], status: null } })
    await fill(wrapper, { name: 'Home', url: 'http://pi.hole', password: 'secret' })
    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('options_instances_test'))!
      .trigger('click')
    await flushPromises()

    expect(calls).toEqual(['permissions.request', 'testInstance'])
    expect(wrapper.emitted('saved')).toBeUndefined()
  })
})
