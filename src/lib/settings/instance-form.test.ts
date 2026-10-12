import { describe, expect, it } from 'vitest'

import { instance } from '@/test/helpers'

import { upsertInstance, validateInstanceForm } from './instance-form'

describe('validateInstanceForm', () => {
  it('normalizes the address and trims the name', () => {
    const result = validateInstanceForm({ name: '  Home ', url: ' pi.hole/admin/ ', password: 'secret' }, [])
    expect(result).toEqual({ ok: true, value: { name: 'Home', url: 'http://pi.hole', password: 'secret' } })
  })

  it('keeps the password as typed', () => {
    const result = validateInstanceForm({ name: 'Home', url: 'http://pi.hole', password: ' spaced ' }, [])
    expect(result.ok && result.value.password).toBe(' spaced ')
  })

  it.each([
    [{ name: '', url: 'http://pi.hole', password: '' }, { name: 'name_required' }],
    [{ name: '   ', url: 'http://pi.hole', password: '' }, { name: 'name_required' }],
    [{ name: 'Home', url: '', password: '' }, { url: 'url_empty' }],
    [{ name: 'Home', url: 'ftp://pi.hole', password: '' }, { url: 'url_scheme' }],
    [{ name: 'Home', url: '::::', password: '' }, { url: 'url_invalid' }],
    [
      { name: '', url: '', password: '' },
      { name: 'name_required', url: 'url_empty' }
    ]
  ])('rejects %j', (input, errors) => {
    expect(validateInstanceForm(input, [])).toEqual({ ok: false, errors })
  })

  it('rejects an address another instance already uses, ignoring case and the admin path', () => {
    const others = [instance('http://pi.hole')]
    const result = validateInstanceForm({ name: 'Twin', url: 'HTTP://PI.HOLE/admin', password: '' }, others)
    expect(result).toEqual({ ok: false, errors: { url: 'duplicate_instance' } })
  })

  it('caps the name at 40 characters', () => {
    const result = validateInstanceForm({ name: 'x'.repeat(50), url: 'http://pi.hole', password: '' }, [])
    expect(result.ok && result.value.name).toHaveLength(40)
  })
})

describe('upsertInstance', () => {
  const home = instance('http://pi.hole', 'a', { id: 'home' })
  const office = instance('https://office.example', 'b', { id: 'office' })

  it('replaces in place and keeps the order', () => {
    const edited = { ...home, name: 'Renamed' }
    expect(upsertInstance([home, office], edited)).toEqual([edited, office])
  })

  it('appends a new instance', () => {
    const garage = instance('http://10.0.0.5', 'c', { id: 'garage' })
    expect(upsertInstance([home, office], garage)).toEqual([home, office, garage])
  })
})
