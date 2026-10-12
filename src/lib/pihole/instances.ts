import type { Instance, Settings } from '@/lib/settings/schema'
import { apiBaseUrl } from '@/lib/settings/url'

import { sha256Hex } from './hash'

/** Everything the API layer needs to talk to one Pi-hole. */
export interface InstanceContext {
  id: string
  name: string
  url: string
  apiBase: string
  password: string
  passwordHash: string
  timeoutMs: number
}

export async function toContext(instance: Instance, timeoutMs: number): Promise<InstanceContext> {
  return {
    id: instance.id,
    name: instance.name,
    url: instance.url,
    apiBase: apiBaseUrl(instance.url),
    password: instance.password,
    passwordHash: await sha256Hex(instance.password),
    timeoutMs
  }
}

export function resolveContexts(settings: Settings): Promise<InstanceContext[]> {
  return Promise.all(settings.instances.map((instance) => toContext(instance, settings.requestTimeoutMs)))
}
