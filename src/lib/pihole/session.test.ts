import { beforeEach, describe, expect, it } from 'vitest'
import { fakeBrowser } from 'wxt/testing/fake-browser'

import { deleteDomain, getBlocking } from '@/lib/api/pihole'
import { FakePihole, installFakeNetwork } from '@/test/fake-pihole'
import { contextFor, HOME, instance, permissionsMock, simulateWorkerRestart } from '@/test/helpers'

import { PiholeError } from './errors'
import type { InstanceContext } from './instances'
import { listSessions, logout, recentLoginFailure, withSession } from './session'

describe('withSession', () => {
  let pihole: FakePihole
  let ctx: InstanceContext

  beforeEach(async () => {
    simulateWorkerRestart()
    pihole = new FakePihole('secret')
    installFakeNetwork({ [HOME]: pihole })
    ctx = await contextFor(instance(HOME))
  })

  const status = () => withSession(ctx, (o) => getBlocking({ ...o }))

  it('logs in once and reuses the session with the header, never the query', async () => {
    expect(await status()).toMatchObject({ blocking: 'enabled' })
    expect(await status()).toMatchObject({ blocking: 'enabled' })

    expect(pihole.requestsTo('/auth', 'POST')).toHaveLength(1)
    const calls = pihole.requestsTo('/dns/blocking')
    expect(calls).toHaveLength(2)
    expect(calls.every((r) => r.sid === 'sid-1' && r.query === '')).toBe(true)
    expect(pihole.sessionCount).toBe(1)
  })

  it('shares one login between parallel calls', async () => {
    await Promise.all([status(), status(), status()])
    expect(pihole.requestsTo('/auth', 'POST')).toHaveLength(1)
    expect(pihole.sessionCount).toBe(1)
  })

  it('keeps the session across a service worker restart', async () => {
    await status()
    simulateWorkerRestart()
    await status()
    expect(pihole.requestsTo('/auth', 'POST')).toHaveLength(1)
  })

  it('keeps the session across a browser restart, which empties the session storage area', async () => {
    await status()
    await fakeBrowser.storage.session.clear()
    simulateWorkerRestart()
    await status()
    expect(pihole.requestsTo('/auth', 'POST')).toHaveLength(1)
    expect(pihole.sessionCount).toBe(1)
  })

  it('logs in once more after the Pi-hole forgot the session', async () => {
    await status()
    pihole.expireSessions()
    expect(await status()).toMatchObject({ blocking: 'enabled' })
    expect(pihole.requestsTo('/auth', 'POST')).toHaveLength(2)
  })

  it('reuses the session a parallel call opened after a late 401', async () => {
    await status()
    pihole.expireSessions()
    // The second stale call answers late, after the first one has already logged in again.
    let stale = 0
    pihole.delayWhen((_method, path, sid) => path === '/dns/blocking' && sid === 'sid-1' && ++stale === 2, 40)
    await Promise.all([status(), status()])
    expect(pihole.requestsTo('/auth', 'POST')).toHaveLength(2)
    expect(pihole.sessionCount).toBe(1)
  })

  it('remembers a refused password for background refreshes while user actions still try', async () => {
    pihole.password = 'other'
    await expect(status()).rejects.toMatchObject({ kind: 'unauthorized' })
    expect(await recentLoginFailure(ctx, 60_000)).toMatchObject({ kind: 'unauthorized' })
    expect(await recentLoginFailure(ctx, 0)).toBeNull()

    await expect(status()).rejects.toMatchObject({ kind: 'unauthorized' })
    expect(pihole.requestsTo('/auth', 'POST')).toHaveLength(2)

    pihole.password = 'secret'
    expect(await status()).toMatchObject({ blocking: 'enabled' })
    expect(await recentLoginFailure(ctx, 60_000)).toBeNull()
  })

  it('accepts an empty 204 that carries the text/html header FTL sends', async () => {
    await status()
    pihole.respondWhen(
      (method) => method === 'DELETE',
      () => new Response(null, { status: 204, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
    )
    await expect(
      withSession(ctx, (o) => deleteDomain({ ...o, path: { type: 'allow', kind: 'exact', domain: 'x.example' } }))
    ).resolves.toBeDefined()
  })

  it('rejects an address that answers with a web page instead of the API', async () => {
    pihole.respondWhen(
      () => true,
      () => new Response('<html>login</html>', { status: 200, headers: { 'Content-Type': 'text/html' } }),
      { once: false }
    )
    await expect(status()).rejects.toMatchObject({ kind: 'not_pihole', hint: expect.stringContaining('text/html') })
  })

  it('reports a wrong password without retrying', async () => {
    pihole.password = 'other'
    await expect(status()).rejects.toMatchObject({ kind: 'unauthorized', message: 'password incorrect' })
    expect(pihole.requestsTo('/auth', 'POST')).toHaveLength(1)
    expect(pihole.requestsTo('/dns/blocking')).toHaveLength(0)
  })

  it('surfaces exhausted API seats with the hint', async () => {
    pihole.maxSessions = 0
    await expect(status()).rejects.toMatchObject({ kind: 'seats', hint: 'increase webserver.api.max_sessions' })
    expect(pihole.requestsTo('/auth', 'POST')).toHaveLength(1)
  })

  it('works without a password when the Pi-hole has none', async () => {
    pihole.password = null
    ctx = await contextFor(instance(HOME, ''))
    expect(await status()).toMatchObject({ blocking: 'enabled' })
    expect(pihole.requestsTo('/auth', 'GET')).toHaveLength(1)
    expect(pihole.requestsTo('/auth', 'POST')).toHaveLength(0)
    expect(pihole.requestsTo('/dns/blocking')[0]?.sid).toBeNull()
  })

  it('refuses an empty password when the Pi-hole wants one', async () => {
    ctx = await contextFor(instance(HOME, ''))
    await expect(status()).rejects.toMatchObject({ kind: 'unauthorized' })
  })

  it('logs in again when the configured password changes', async () => {
    await status()
    pihole.password = 'new'
    ctx = await contextFor(instance(HOME, 'new'))
    await status()
    expect(pihole.requestsTo('/auth', 'POST')).toHaveLength(2)
  })

  it('logout frees the seat and forgets the session', async () => {
    await status()
    await logout(ctx)
    expect(pihole.sessionCount).toBe(0)
    expect(pihole.requestsTo('/auth', 'DELETE')).toHaveLength(1)
    expect(await listSessions()).toEqual({})
  })

  it('fails fast without the host permission', async () => {
    permissionsMock().contains.mockResolvedValue(false)
    await expect(status()).rejects.toMatchObject({ kind: 'permission' })
    expect(pihole.requests).toHaveLength(0)
  })

  it('maps timeouts and network failures', async () => {
    pihole.failWhen((_m, path) => path === '/dns/blocking', 'timeout')
    await expect(status()).rejects.toMatchObject({ kind: 'timeout' })
    pihole.failAll('network')
    await expect(status()).rejects.toBeInstanceOf(PiholeError)
    await expect(status()).rejects.toMatchObject({ kind: 'unreachable' })
  })

  it('treats an unknown host as unreachable', async () => {
    ctx = await contextFor(instance('http://nowhere.invalid'))
    await expect(status()).rejects.toMatchObject({ kind: 'unreachable' })
  })
})
