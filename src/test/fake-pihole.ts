import { vi } from 'vitest'

/**
 * An in-memory Pi-hole v6 behind `fetch`. It implements the handful of endpoints the extension
 * uses, checks the `X-FTL-SID` header like FTL does, limits sessions and can be told to fail.
 */

export interface FakeDomainEntry {
  domain: string
  type: 'allow' | 'deny'
  kind: 'exact' | 'regex'
  comment: string | null
  enabled: boolean
  id: number
  groups: number[]
  date_added: number
  date_modified: number
}

export interface FakeGravityEntry {
  domain: string
  address: string
  comment: string | null
  enabled: boolean
  id: number
  type: 'allow' | 'block'
}

export interface RecordedRequest {
  method: string
  path: string
  sid: string | null
  query: string
  body: unknown
}

export type FailureMode = 'network' | 'timeout' | number

interface Failure {
  test: (method: string, path: string) => boolean
  mode: FailureMode
  once: boolean
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

function unixNow(): number {
  return Math.floor(Date.now() / 1000)
}

export class FakePihole {
  /** `null` means the Pi-hole has no password and needs no session. */
  password: string | null
  maxSessions = 16
  sessionValidity = 300
  blocking: 'enabled' | 'disabled' = 'enabled'
  timer: number | null = null
  sessions = new Map<string, { createdAt: number }>()
  domains: FakeDomainEntry[] = []
  gravity: FakeGravityEntry[] = []
  versions = {
    core: 'v6.4.2',
    web: 'v6.5',
    ftl: 'v6.6.1',
    docker: '2026.10.1',
    remote: { core: 'v6.4.2', web: 'v6.5', ftl: 'v6.6.1', docker: '2026.10.1' }
  }
  messagesCount = 0
  stats = { total: 98_585, blocked: 35_537, percent: 36.04, clientsActive: 24, clientsTotal: 30 }
  requests: RecordedRequest[] = []

  private failures: Failure[] = []
  private nextId = 1
  private sidCounter = 0

  constructor(password: string | null = 'secret') {
    this.password = password
  }

  /** Fails matching requests. By default only the next matching one. */
  failWhen(test: (method: string, path: string) => boolean, mode: FailureMode, options: { once?: boolean } = {}): void {
    this.failures.push({ test, mode, once: options.once ?? true })
  }

  failAll(mode: FailureMode): void {
    this.failWhen(() => true, mode, { once: false })
  }

  clearFailures(): void {
    this.failures = []
  }

  addDomain(
    type: 'allow' | 'deny',
    kind: 'exact' | 'regex',
    domain: string,
    comment: string | null = null
  ): FakeDomainEntry {
    const entry: FakeDomainEntry = {
      domain,
      type,
      kind,
      comment,
      enabled: true,
      id: this.nextId++,
      groups: [0],
      date_added: unixNow(),
      date_modified: unixNow()
    }
    this.domains.push(entry)
    return entry
  }

  addGravity(domain: string, address: string, comment: string | null = null, type: 'allow' | 'block' = 'block'): void {
    this.gravity.push({ domain, address, comment, enabled: true, id: this.nextId++, type })
  }

  expireSessions(): void {
    this.sessions.clear()
  }

  get sessionCount(): number {
    return this.sessions.size
  }

  requestsTo(path: string, method?: string): RecordedRequest[] {
    return this.requests.filter((r) => r.path === path && (method === undefined || r.method === method))
  }

  private login(password: unknown): Response {
    if (this.password === null) {
      return json({
        session: { valid: true, totp: false, sid: null, csrf: null, validity: -1, message: 'no password set' },
        took: 0.1
      })
    }
    if (password !== this.password) {
      return json(
        {
          session: { valid: false, totp: false, sid: null, csrf: null, validity: -1, message: 'password incorrect' },
          took: 0.1
        },
        401
      )
    }
    if (this.sessions.size >= this.maxSessions) {
      return json(
        {
          error: {
            key: 'api_seats_exceeded',
            message: 'API seats exceeded',
            hint: 'increase webserver.api.max_sessions'
          },
          took: 0.1
        },
        429
      )
    }
    const sid = `sid-${++this.sidCounter}`
    this.sessions.set(sid, { createdAt: Date.now() })
    return json({
      session: {
        valid: true,
        totp: false,
        sid,
        csrf: 'csrf',
        validity: this.sessionValidity,
        message: 'password correct'
      },
      took: 0.1
    })
  }

  private unauthorized(): Response {
    return json({ error: { key: 'unauthorized', message: 'Unauthorized', hint: null }, took: 0.1 }, 401)
  }

  async handle(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const apiIndex = url.pathname.indexOf('/api/')
    const path = apiIndex === -1 ? url.pathname : url.pathname.slice(apiIndex + 4)
    const method = request.method
    const sid = request.headers.get('X-FTL-SID')
    const text = await request.text()
    const body: unknown = text ? JSON.parse(text) : undefined
    this.requests.push({ method, path, sid, query: url.search, body })

    const failure = this.failures.find((f) => f.test(method, path))
    if (failure) {
      if (failure.once) this.failures = this.failures.filter((f) => f !== failure)
      if (failure.mode === 'network') throw new TypeError('Failed to fetch')
      if (failure.mode === 'timeout') throw new DOMException('The operation timed out', 'TimeoutError')
      return json(
        { error: { key: 'injected', message: `Injected HTTP ${failure.mode}`, hint: null }, took: 0.1 },
        failure.mode
      )
    }

    if (path === '/auth') {
      if (method === 'POST') return this.login((body as { password?: unknown } | undefined)?.password)
      if (method === 'GET') {
        if (this.password === null) {
          return json({
            session: { valid: true, totp: false, sid: null, csrf: null, validity: -1, message: null },
            took: 0.1
          })
        }
        if (sid && this.sessions.has(sid)) {
          return json({
            session: { valid: true, totp: false, sid, csrf: 'csrf', validity: this.sessionValidity, message: null },
            took: 0.1
          })
        }
        return json(
          {
            session: { valid: false, totp: false, sid: null, csrf: null, validity: -1, message: 'password incorrect' },
            took: 0.1
          },
          401
        )
      }
      if (method === 'DELETE') {
        if (sid && this.sessions.delete(sid)) return new Response(null, { status: 204 })
        return json({ took: 0.1 }, 404)
      }
    }

    if (path === '/info/login') return json({ https_port: 0, dns: true, took: 0.1 })

    if (this.password !== null) {
      if (!sid || !this.sessions.has(sid)) return this.unauthorized()
      this.sessions.set(sid, { createdAt: Date.now() })
    }

    if (path === '/dns/blocking') {
      if (method === 'POST') {
        const payload = body as { blocking?: boolean; timer?: number | null }
        this.blocking = payload.blocking === false ? 'disabled' : 'enabled'
        this.timer = this.blocking === 'disabled' ? (payload.timer ?? null) : null
      }
      return json({ blocking: this.blocking, timer: this.timer, took: 0.1 })
    }

    if (path === '/info/version') {
      const v = this.versions
      return json({
        version: {
          core: {
            local: { branch: 'master', version: v.core, hash: 'a' },
            remote: { version: v.remote.core, hash: 'a' }
          },
          web: { local: { branch: 'master', version: v.web, hash: 'b' }, remote: { version: v.remote.web, hash: 'b' } },
          ftl: {
            local: { branch: 'master', version: v.ftl, hash: 'c', date: '2026-01-01' },
            remote: { version: v.remote.ftl, hash: 'c' }
          },
          docker: { local: v.docker, remote: v.remote.docker }
        },
        took: 0.1
      })
    }

    if (path === '/info/messages/count') return json({ count: this.messagesCount, took: 0.1 })

    if (path === '/stats/summary') {
      return json({
        queries: { total: this.stats.total, blocked: this.stats.blocked, percent_blocked: this.stats.percent },
        clients: { active: this.stats.clientsActive, total: this.stats.clientsTotal },
        gravity: { domains_being_blocked: 1_000_000 },
        took: 0.1
      })
    }

    if (path.startsWith('/search/')) {
      const domain = decodeURIComponent(path.slice('/search/'.length)).toLowerCase()
      const domains = this.domains.filter((entry) => {
        if (entry.kind === 'exact') return entry.domain === domain
        try {
          return new RegExp(entry.domain).test(domain)
        } catch {
          return false
        }
      })
      const gravity = this.gravity.filter((entry) => entry.domain === domain)
      return json({
        search: {
          domains,
          gravity,
          parameters: { partial: false, N: 20, domain, debug: false },
          results: {
            domains: {
              exact: domains.filter((d) => d.kind === 'exact').length,
              regex: domains.filter((d) => d.kind === 'regex').length
            },
            gravity: {
              allow: gravity.filter((g) => g.type === 'allow').length,
              block: gravity.filter((g) => g.type === 'block').length
            },
            total: domains.length + gravity.length
          }
        },
        took: 0.1
      })
    }

    const domainRoute = path.match(/^\/domains\/(allow|deny)\/(exact|regex)(?:\/(.+))?$/)
    if (domainRoute) {
      const type = domainRoute[1] as 'allow' | 'deny'
      const kind = domainRoute[2] as 'exact' | 'regex'
      const target = domainRoute[3] ? decodeURIComponent(domainRoute[3]) : undefined

      if (method === 'POST' && target === undefined) {
        const payload = body as {
          domain?: string | string[]
          comment?: string | null
          groups?: number[]
          enabled?: boolean
        }
        const names = Array.isArray(payload.domain) ? payload.domain : [payload.domain ?? '']
        const added: FakeDomainEntry[] = []
        for (const name of names) {
          const exists = this.domains.some((e) => e.type === type && e.kind === kind && e.domain === name)
          if (exists) {
            return json(
              {
                error: {
                  key: 'database_error',
                  message: 'Could not add to gravity database',
                  hint: 'The item is already present'
                },
                took: 0.1
              },
              400
            )
          }
          added.push(this.addDomain(type, kind, name, payload.comment ?? null))
        }
        return json(
          { domains: added, processed: { success: added.map((e) => ({ item: e.domain })), errors: [] }, took: 0.1 },
          201
        )
      }

      if (target !== undefined) {
        const index = this.domains.findIndex((e) => e.type === type && e.kind === kind && e.domain === target)
        if (method === 'GET') {
          return index === -1 ? json({ domains: [], took: 0.1 }) : json({ domains: [this.domains[index]], took: 0.1 })
        }
        if (method === 'DELETE') {
          if (index === -1) return json({ took: 0.1 }, 404)
          this.domains.splice(index, 1)
          return new Response(null, { status: 204 })
        }
      }
    }

    return json({ error: { key: 'not_found', message: `No route for ${method} ${path}`, hint: null }, took: 0.1 }, 404)
  }
}

/** Routes `fetch` to the fake Pi-holes by origin; anything else fails like an unreachable host. */
export function installFakeNetwork(instances: Record<string, FakePihole>): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: Request | string | URL, init?: RequestInit) => {
      const request = input instanceof Request ? input : new Request(input, init)
      const origin = new URL(request.url).origin
      const pihole = instances[origin]
      if (!pihole) throw new TypeError('Failed to fetch')
      if (request.signal?.aborted) throw new DOMException('The operation was aborted', 'AbortError')
      return pihole.handle(request)
    })
  )
}
