export type PiholeErrorKind =
  | 'unreachable'
  | 'timeout'
  | 'permission'
  | 'unauthorized'
  | 'seats'
  | 'rate_limited'
  | 'duplicate'
  | 'regex'
  | 'bad_request'
  | 'not_found'
  | 'http'
  | 'unknown'

/** Plain-object form of a `PiholeError`. This is what crosses the messaging boundary and lands in state. */
export interface PiholeErrorData {
  kind: PiholeErrorKind
  instanceId?: string
  status?: number
  /** Pi-hole's machine readable `error.key`, when the response carried one. */
  apiKey?: string
  message: string
  hint?: string
}

export class PiholeError extends Error implements PiholeErrorData {
  readonly kind: PiholeErrorKind
  readonly instanceId?: string
  readonly status?: number
  readonly apiKey?: string
  readonly hint?: string

  constructor(data: Partial<PiholeErrorData> & { kind: PiholeErrorKind }) {
    super(data.message ?? data.kind)
    this.name = 'PiholeError'
    this.kind = data.kind
    this.instanceId = data.instanceId
    this.status = data.status
    this.apiKey = data.apiKey
    this.hint = data.hint
  }

  toJSON(): PiholeErrorData {
    const data: PiholeErrorData = { kind: this.kind, message: this.message }
    if (this.instanceId !== undefined) data.instanceId = this.instanceId
    if (this.status !== undefined) data.status = this.status
    if (this.apiKey !== undefined) data.apiKey = this.apiKey
    if (this.hint !== undefined) data.hint = this.hint
    return data
  }

  static from(error: unknown, instanceId?: string): PiholeError {
    if (error instanceof PiholeError) return error
    if (isTimeout(error)) {
      return new PiholeError({ kind: 'timeout', instanceId, message: 'The Pi-hole did not answer in time' })
    }
    if (error instanceof TypeError) {
      return new PiholeError({ kind: 'unreachable', instanceId, message: error.message })
    }
    const message = error instanceof Error ? error.message : String(error)
    return new PiholeError({ kind: 'unknown', instanceId, message })
  }
}

/** The subset of a generated SDK result that error mapping needs. */
export interface ApiOutcome<T = unknown> {
  data?: T
  error?: unknown
  response?: Response
}

interface ErrorBody {
  error?: { key?: string; message?: string; hint?: string | null }
  session?: { valid?: boolean; message?: string | null }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isTimeout(error: unknown): boolean {
  return (
    isRecord(error) && typeof error.name === 'string' && (error.name === 'TimeoutError' || error.name === 'AbortError')
  )
}

function readBody(error: unknown): ErrorBody {
  return isRecord(error) ? (error as ErrorBody) : {}
}

/** Maps a failed SDK result to a `PiholeError`. Call only when the result has no usable data. */
export function errorFromOutcome(instanceId: string | undefined, outcome: ApiOutcome): PiholeError {
  if (outcome.response === undefined) return PiholeError.from(outcome.error, instanceId)

  const status = outcome.response.status
  const body = readBody(outcome.error)
  const apiKey = body.error?.key
  const hint = body.error?.hint ?? undefined
  const message = body.error?.message ?? body.session?.message ?? outcome.response.statusText ?? `HTTP ${status}`
  const base = { instanceId, status, apiKey, message, hint }

  if (status === 401) return new PiholeError({ ...base, kind: 'unauthorized' })
  if (status === 429) {
    return new PiholeError({ ...base, kind: apiKey === 'api_seats_exceeded' ? 'seats' : 'rate_limited' })
  }
  if (status === 400) {
    if (apiKey === 'database_error' && /already present|UNIQUE/i.test(`${hint ?? ''} ${message}`)) {
      return new PiholeError({ ...base, kind: 'duplicate' })
    }
    if (apiKey === 'regex_error') return new PiholeError({ ...base, kind: 'regex' })
    return new PiholeError({ ...base, kind: 'bad_request' })
  }
  if (status === 404) return new PiholeError({ ...base, kind: 'not_found' })
  return new PiholeError({ ...base, kind: 'http' })
}

export function isUnauthorized(outcome: ApiOutcome): boolean {
  return outcome.response?.status === 401
}

export function permissionError(instanceId: string, url: string): PiholeError {
  return new PiholeError({
    kind: 'permission',
    instanceId,
    message: `The browser has not granted access to ${url}`
  })
}

/** Serializes any thrown value for a message response or the state object. */
export function toErrorData(error: unknown, instanceId?: string): PiholeErrorData {
  return PiholeError.from(error, instanceId).toJSON()
}
