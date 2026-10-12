import { describe, expect, it } from 'vitest'

import { errorFromOutcome, PiholeError, toErrorData } from './errors'

function response(status: number): Response {
  return new Response(null, { status })
}

describe('errorFromOutcome', () => {
  it.each([
    ['network failure', { error: new TypeError('Failed to fetch') }, 'unreachable'],
    ['timeout', { error: new DOMException('timed out', 'TimeoutError') }, 'timeout'],
    ['abort', { error: new DOMException('aborted', 'AbortError') }, 'timeout'],
    [
      '401 error body',
      { error: { error: { key: 'unauthorized', message: 'Unauthorized' } }, response: response(401) },
      'unauthorized'
    ],
    [
      '401 session body',
      { error: { session: { valid: false, message: 'password incorrect' } }, response: response(401) },
      'unauthorized'
    ],
    [
      '429 seats',
      {
        error: { error: { key: 'api_seats_exceeded', message: 'x', hint: 'increase webserver.api.max_sessions' } },
        response: response(429)
      },
      'seats'
    ],
    [
      '429 rate limit',
      { error: { error: { key: 'rate_limiting', message: 'x' } }, response: response(429) },
      'rate_limited'
    ],
    [
      '400 duplicate',
      {
        error: { error: { key: 'database_error', message: 'Could not add', hint: 'The item is already present' } },
        response: response(400)
      },
      'duplicate'
    ],
    [
      '400 regex',
      { error: { error: { key: 'regex_error', message: 'Regex validation failed' } }, response: response(400) },
      'regex'
    ],
    [
      '400 other',
      { error: { error: { key: 'uri_error', message: 'Specify item' } }, response: response(400) },
      'bad_request'
    ],
    ['404', { error: { took: 0.1 }, response: response(404) }, 'not_found'],
    ['500', { error: 'boom', response: response(500) }, 'http']
  ])('maps %s', (_label, outcome, kind) => {
    const error = errorFromOutcome('home', outcome)
    expect(error.kind).toBe(kind)
    expect(error.instanceId).toBe('home')
  })

  it('carries message, hint, status and api key', () => {
    const error = errorFromOutcome('home', {
      error: { error: { key: 'api_seats_exceeded', message: 'API seats exceeded', hint: 'raise it' } },
      response: response(429)
    })
    expect(error.toJSON()).toEqual({
      kind: 'seats',
      instanceId: 'home',
      status: 429,
      apiKey: 'api_seats_exceeded',
      message: 'API seats exceeded',
      hint: 'raise it'
    })
  })

  it('points at app passwords when TOTP is on, and names the status when statusText is empty', () => {
    const totp = errorFromOutcome('home', {
      error: { session: { valid: false, totp: true, message: 'password incorrect' } },
      response: response(401)
    })
    expect(totp.kind).toBe('unauthorized')
    expect(totp.hint).toContain('app password')

    const bare = errorFromOutcome('home', { error: 'boom', response: response(502) })
    expect(bare.message).toBe('HTTP 502')
  })

  it('uses the session message for a failed login', () => {
    const error = errorFromOutcome('home', {
      error: { session: { valid: false, message: 'password incorrect' } },
      response: response(401)
    })
    expect(error.message).toBe('password incorrect')
  })
})

describe('toErrorData', () => {
  it('keeps PiholeError data and wraps anything else as unknown', () => {
    expect(toErrorData(new PiholeError({ kind: 'timeout', message: 'slow' }))).toEqual({
      kind: 'timeout',
      message: 'slow'
    })
    expect(toErrorData(new Error('oops'), 'x')).toEqual({ kind: 'unknown', instanceId: 'x', message: 'oops' })
    expect(toErrorData('text')).toEqual({ kind: 'unknown', message: 'text' })
  })
})
