import { browser, storage } from '#imports'
import { addAuth, getAuth, logout as logoutRequest } from '@/lib/api/pihole'
import { hasHostPermission } from '@/lib/permissions'

import { type CallOptions, callApi, getClient } from './client'
import {
  type ApiOutcome,
  errorFromOutcome,
  isUnauthorized,
  notPiholeError,
  permissionError,
  PiholeError,
  type PiholeErrorData,
  TOTP_HINT
} from './errors'
import type { InstanceContext } from './instances'

export interface SessionRecord {
  /** `null` when the Pi-hole has no password and needs no session. */
  sid: string | null
  noAuth: boolean
  /** Hash of the password the session was created with; a changed password invalidates it. */
  passwordHash: string
  url: string
  createdAt: number
  /** Seconds the Pi-hole reported at login, `-1` when not applicable. */
  validity: number
  lastUsedAt: number
  /** Set instead of a session when the last login was refused, so background refreshes back off. */
  loginFailedAt?: number
  failure?: PiholeErrorData
}

/** Background refreshes do not retry a refused password for this long; user actions always do. */
export const LOGIN_BACKOFF_MS = 10 * 60_000

/**
 * One storage key per instance, so two Pi-holes logging in at the same time never overwrite each
 * other's record. Records live in `local:` on purpose: the `session:` area is cleared by every
 * extension reload and browser restart, and each of those would leave a session behind on the
 * Pi-hole until its timeout while a new one takes another seat. The password sits in `local:`
 * anyway, so the session id adds nothing an attacker with that access would not already have.
 */
const SESSION_KEY_PREFIX = 'pihole-session:'

function sessionKey(id: string): `local:${string}` {
  return `local:${SESSION_KEY_PREFIX}${id}`
}

/** Logins in progress, so parallel calls from the alarm and the popup share one login. */
const inflightLogins = new Map<string, Promise<SessionRecord>>()

const EXPIRY_MARGIN_MS = 5_000

async function readRecord(ctx: InstanceContext): Promise<SessionRecord | null> {
  const record = await storage.getItem<SessionRecord>(sessionKey(ctx.id))
  if (!record) return null
  if (record.url !== ctx.url || record.passwordHash !== ctx.passwordHash) return null
  if (record.loginFailedAt !== undefined) return null
  if (!record.noAuth && record.validity > 0) {
    if (Date.now() >= record.lastUsedAt + record.validity * 1000 - EXPIRY_MARGIN_MS) return null
  }
  return record
}

async function saveRecord(ctx: InstanceContext, record: SessionRecord): Promise<SessionRecord> {
  await storage.setItem(sessionKey(ctx.id), record)
  return record
}

/** Slides the validity window, but only for the session that was actually used: a re-login may have replaced it. */
async function touch(id: string, usedSid: string | null): Promise<void> {
  const record = await storage.getItem<SessionRecord>(sessionKey(id))
  if (!record || record.sid !== usedSid) return
  if (Date.now() - record.lastUsedAt < 10_000) return
  await storage.setItem(sessionKey(id), { ...record, lastUsedAt: Date.now() })
}

/**
 * Forgets the cached session. With `onlySid`, nothing happens when a parallel call has already
 * replaced the session with a fresh one, so a late 401 cannot throw away a good login.
 */
export async function invalidateSession(id: string, onlySid?: string | null): Promise<void> {
  if (onlySid !== undefined) {
    const record = await storage.getItem<SessionRecord>(sessionKey(id))
    if (record && record.sid !== onlySid) return
  }
  await storage.removeItem(sessionKey(id))
}

/** The refused login of the current password, when it happened within `maxAgeMs`. */
export async function recentLoginFailure(ctx: InstanceContext, maxAgeMs: number): Promise<PiholeErrorData | null> {
  const record = await storage.getItem<SessionRecord>(sessionKey(ctx.id))
  if (!record?.loginFailedAt || !record.failure) return null
  if (record.url !== ctx.url || record.passwordHash !== ctx.passwordHash) return null
  return Date.now() - record.loginFailedAt < maxAgeMs ? record.failure : null
}

async function rememberFailure(ctx: InstanceContext, error: PiholeError): Promise<void> {
  await storage.setItem(sessionKey(ctx.id), {
    ...recordFor(ctx, null, -1),
    noAuth: false,
    loginFailedAt: Date.now(),
    failure: error.toJSON()
  })
}

/**
 * JSON, or nothing at all: FTL answers 204 with an empty body that civetweb labels text/html, which
 * the client hands over as an empty string. Only a non-empty text body is a web page.
 */
function isApiBody(data: unknown): boolean {
  if (data === undefined || data === null || typeof data === 'object') return true
  return typeof data === 'string' && data.trim() === ''
}

/** A 2xx that is not JSON from the Pi-hole's own origin is a reverse proxy, a login page or a redirect. */
function checkApiAnswer(ctx: InstanceContext, outcome: ApiOutcome): void {
  const response = outcome.response
  if (!response?.ok) return
  if (!isApiBody(outcome.data)) {
    const type = response.headers.get('content-type') ?? 'unknown content type'
    throw notPiholeError(ctx.id, response.status, `${ctx.apiBase} answered with ${type}`)
  }
  if (response.url) {
    const origin = new URL(response.url).origin
    if (origin !== new URL(ctx.apiBase).origin) {
      throw notPiholeError(ctx.id, response.status, `${ctx.apiBase} redirected to ${origin}`)
    }
  }
}

/** All cached sessions by instance id. */
export async function listSessions(): Promise<Record<string, SessionRecord>> {
  const all = (await browser.storage.local.get(null)) as Record<string, unknown>
  const result: Record<string, SessionRecord> = {}
  for (const [key, value] of Object.entries(all)) {
    if (key.startsWith(SESSION_KEY_PREFIX) && value)
      result[key.slice(SESSION_KEY_PREFIX.length)] = value as SessionRecord
  }
  return result
}

/** Forgets sessions of instances that no longer exist. Does not log them out; use `logout` for that. */
export async function dropSessionsExcept(ids: string[]): Promise<void> {
  const keep = new Set(ids)
  const stale = Object.keys(await listSessions()).filter((id) => !keep.has(id))
  await Promise.all(stale.map((id) => invalidateSession(id)))
}

function recordFor(ctx: InstanceContext, sid: string | null, validity: number): SessionRecord {
  const now = Date.now()
  return {
    sid,
    noAuth: sid === null,
    passwordHash: ctx.passwordHash,
    url: ctx.url,
    createdAt: now,
    validity,
    lastUsedAt: now
  }
}

/** Logs in once. Never retries by itself: a wrong password must not hammer the Pi-hole. */
export async function login(ctx: InstanceContext): Promise<SessionRecord> {
  if (ctx.password === '') {
    // No password configured here. If the Pi-hole agrees, calls work without a session.
    const probe = await callApi(ctx, null, (o) => getAuth({ ...o }))
    if (probe.response?.ok && probe.data?.session?.valid) {
      return saveRecord(ctx, recordFor(ctx, null, -1))
    }
    throw new PiholeError({
      kind: 'unauthorized',
      instanceId: ctx.id,
      status: probe.response?.status,
      message: 'This Pi-hole requires a password'
    })
  }

  const result = await callApi(ctx, null, (o) => addAuth({ ...o, body: { password: ctx.password } }))
  checkApiAnswer(ctx, result)
  const session = result.response?.ok ? result.data?.session : undefined
  if (session) {
    if (session.valid && session.sid) {
      return saveRecord(ctx, recordFor(ctx, session.sid, session.validity))
    }
    if (session.valid && session.sid === null) {
      return saveRecord(ctx, recordFor(ctx, null, -1))
    }
    throw new PiholeError({
      kind: 'unauthorized',
      instanceId: ctx.id,
      status: result.response?.status,
      message: session.message ?? 'Login failed',
      hint: session.totp ? TOTP_HINT : undefined
    })
  }
  throw errorFromOutcome(ctx.id, result)
}

function loginOnce(ctx: InstanceContext): Promise<SessionRecord> {
  let pending = inflightLogins.get(ctx.id)
  if (!pending) {
    pending = login(ctx)
      .catch(async (error: unknown) => {
        if (error instanceof PiholeError && error.kind === 'unauthorized') await rememberFailure(ctx, error)
        throw error
      })
      .finally(() => inflightLogins.delete(ctx.id))
    inflightLogins.set(ctx.id, pending)
  }
  return pending
}

/**
 * Runs an authenticated SDK call against one Pi-hole: reuses the cached session, logs in when there
 * is none, and on a 401 logs in exactly once more and retries. Resolves with the response data or
 * throws a `PiholeError`.
 */
export async function withSession<T>(
  ctx: InstanceContext,
  fn: (options: CallOptions) => Promise<ApiOutcome<T>>
): Promise<T> {
  if (!(await hasHostPermission(ctx.url))) throw permissionError(ctx.id, ctx.url)

  let record = await readRecord(ctx)
  let fresh = false
  if (!record) {
    record = await loginOnce(ctx)
    fresh = true
  }

  let outcome = await callApi(ctx, record.sid, fn)
  if (isUnauthorized(outcome)) {
    await invalidateSession(ctx.id, record.sid)
    if (fresh) throw errorFromOutcome(ctx.id, outcome)
    // A parallel call may have logged in again meanwhile; reuse that session instead of opening another seat.
    record = (await readRecord(ctx)) ?? (await loginOnce(ctx))
    outcome = await callApi(ctx, record.sid, fn)
  }

  if (outcome.error !== undefined || !outcome.response?.ok) throw errorFromOutcome(ctx.id, outcome)
  checkApiAnswer(ctx, outcome)
  void touch(ctx.id, record.sid)
  return outcome.data as T
}

/** Ends the cached session on the Pi-hole (frees its seat) and forgets it. Never throws. */
export async function logout(ctx: InstanceContext): Promise<void> {
  const record = await storage.getItem<SessionRecord>(sessionKey(ctx.id))
  if (record?.sid) {
    await callApi(ctx, record.sid, (o) => logoutRequest({ ...o }))
  }
  await invalidateSession(ctx.id)
}

/** Ends a session the extension does not track, such as one left behind by v4. Never throws. */
export async function logoutSid(apiBase: string, sid: string, timeoutMs = 5_000): Promise<void> {
  const ctx: InstanceContext = {
    id: `legacy:${apiBase}`,
    name: apiBase,
    url: apiBase.replace(/\/api$/, ''),
    apiBase,
    password: '',
    passwordHash: '',
    timeoutMs
  }
  if (!(await hasHostPermission(ctx.url))) return
  await callApi(ctx, sid, (o) => logoutRequest({ ...o, client: getClient(ctx) }))
}

export function _resetSessionMemoryForTests(): void {
  inflightLogins.clear()
}
