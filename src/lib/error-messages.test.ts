import { describe, expect, it } from 'vitest'

import { errorMessage, errorSourceName } from './error-messages'

describe('errorMessage', () => {
  it('adds the hint to a rejected request, which is where Pi-hole puts the actual reason', () => {
    expect(
      errorMessage({
        kind: 'bad_request',
        message: 'Could not add to gravity database',
        hint: 'database is locked'
      })
    ).toBe('errors_bad_request:Could not add to gravity database · database is locked')
    expect(errorMessage({ kind: 'bad_request', message: 'Bad request' })).toBe('errors_bad_request:Bad request')
  })

  it('maps the fixed kinds to their keys', () => {
    expect(errorMessage({ kind: 'unauthorized', message: 'x' })).toBe('errors_unauthorized')
    expect(errorMessage({ kind: 'http', message: 'x', status: 502 })).toBe('errors_http:502')
  })
})

describe('errorSourceName', () => {
  const instances = [
    { id: 'home', name: 'Home' },
    { id: 'office', name: 'Office' }
  ]

  it('names the Pi-hole only when there are several', () => {
    const error = { kind: 'bad_request' as const, message: 'x', instanceId: 'office' }
    expect(errorSourceName(error, instances)).toBe('Office')
    expect(errorSourceName(error, [instances[1]!])).toBeNull()
    expect(errorSourceName({ kind: 'unknown', message: 'x' }, instances)).toBeNull()
    expect(errorSourceName(null, instances)).toBeNull()
  })
})
