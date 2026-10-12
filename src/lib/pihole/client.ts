import { type Client, createClient, createConfig } from '@/lib/api/pihole/client'

import type { ApiOutcome } from './errors'
import { PiholeError } from './errors'
import type { InstanceContext } from './instances'

const clients = new Map<string, Client>()

/** One fetch client per Pi-hole, keyed by its API base. Cookies are never sent or stored. */
export function getClient(ctx: InstanceContext): Client {
  let client = clients.get(ctx.apiBase)
  if (!client) {
    client = createClient(createConfig({ baseUrl: ctx.apiBase, credentials: 'omit' }))
    clients.set(ctx.apiBase, client)
  }
  return client
}

/** Options every SDK call receives: the instance's client, the session header and a timeout. */
export interface CallOptions {
  client: Client
  headers: Record<string, string>
  signal: AbortSignal
  throwOnError: false
}

export function callOptions(ctx: InstanceContext, sid: string | null): CallOptions {
  return {
    client: getClient(ctx),
    headers: sid ? { 'X-FTL-SID': sid } : {},
    signal: AbortSignal.timeout(ctx.timeoutMs),
    throwOnError: false
  }
}

/**
 * Runs one SDK call. The generated client returns failures as `{ error }` instead of throwing, but
 * anything thrown on the way (a rejected fetch, an aborted signal) is folded into the same shape so
 * callers deal with exactly one result type.
 */
export async function callApi<T>(
  ctx: InstanceContext,
  sid: string | null,
  fn: (options: CallOptions) => Promise<ApiOutcome<T>>
): Promise<ApiOutcome<T>> {
  try {
    return await fn(callOptions(ctx, sid))
  } catch (error) {
    return { error: PiholeError.from(error, ctx.id) }
  }
}

export function _resetClientsForTests(): void {
  clients.clear()
}
