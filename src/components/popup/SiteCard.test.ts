import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import type { SiteStatus } from '@/lib/pihole/site-status'

import SiteCard from './SiteCard.vue'

function site(overrides: Partial<SiteStatus>): SiteStatus {
  return {
    hostname: 'ads.example.com',
    verdict: 'not-blocked',
    listName: null,
    ownEntry: null,
    tempUntil: null,
    perInstance: [],
    checkedAt: Date.now(),
    ...overrides
  }
}

describe('SiteCard', () => {
  it.each([
    [site({ verdict: 'blocked-list', listName: 'StevenBlack hosts' }), 'popup_site_blockedByList:StevenBlack hosts'],
    [site({ verdict: 'blocked-own' }), 'popup_site_blockedByYou'],
    [site({ verdict: 'allowed-own' }), 'popup_site_allowedByYou'],
    [site({ verdict: 'allowed-list', listName: 'mine' }), 'popup_site_allowedByList:mine'],
    [site({ verdict: 'not-blocked' }), 'popup_site_notBlocked'],
    [site({ verdict: 'unknown' }), 'popup_site_unknown']
  ])('describes %o', (status, text) => {
    const wrapper = mount(SiteCard, { props: { hostname: 'ads.example.com', site: status } })
    expect(wrapper.text()).toContain(text)
    expect(wrapper.text()).toContain('ads.example.com')
  })

  it('overrides the status while paused and shows checking before the first answer', () => {
    const paused = mount(SiteCard, {
      props: { hostname: 'x.example', site: site({ verdict: 'blocked-list' }), paused: true }
    })
    expect(paused.text()).toContain('popup_site_paused')
    const loading = mount(SiteCard, { props: { hostname: 'x.example', site: null, loading: true } })
    expect(loading.text()).toContain('popup_site_checking')
  })

  it('marks the own entry as pressed and offers to remove it', async () => {
    const wrapper = mount(SiteCard, { props: { hostname: 'x.example', site: site({ verdict: 'allowed-own' }) } })
    const [allow, deny] = wrapper.findAll('[aria-keyshortcuts]')
    expect(allow!.attributes('aria-pressed')).toBe('true')
    expect(allow!.text()).toContain('popup_site_allowed')
    expect(deny!.attributes('aria-pressed')).toBe('false')
    expect(wrapper.text()).toContain('popup_site_removeAllow')
    await allow!.trigger('click')
    expect(wrapper.emitted('remove')).toEqual([['allow']])
  })

  it('emits allow, deny, temporary allow and open', async () => {
    const wrapper = mount(SiteCard, { props: { hostname: 'x.example', site: site({}), tempAllowMinutes: 15 } })
    const [allow, deny] = wrapper.findAll('[aria-keyshortcuts]')
    await allow!.trigger('click')
    await deny!.trigger('click')
    expect(wrapper.emitted('allow')).toHaveLength(1)
    expect(wrapper.emitted('deny')).toHaveLength(1)

    const links = wrapper
      .findAll('button')
      .filter((button) => /popup_site_allowTemp|popup_site_openAdmin/.test(button.text()))
    expect(links[0]!.text()).toContain('popup_site_allowTemp:15')
    await links[0]!.trigger('click')
    expect(wrapper.emitted('tempAllow')).toHaveLength(1)
    await links[1]!.trigger('click')
    expect(wrapper.emitted('open')).toHaveLength(1)
  })

  it('shows an error line', () => {
    const wrapper = mount(SiteCard, {
      props: { hostname: 'x.example', site: site({}), error: { kind: 'unauthorized', message: 'nope' } }
    })
    expect(wrapper.get('[role="alert"]').text()).toContain('errors_unauthorized')
  })
})
