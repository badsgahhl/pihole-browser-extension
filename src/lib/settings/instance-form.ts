import type { Instance } from './schema'
import { InvalidUrlError, normalizeInstanceUrl } from './url'

export const NAME_MAX_LENGTH = 40

export type InstanceFormErrorCode = 'name_required' | 'url_empty' | 'url_scheme' | 'url_invalid' | 'duplicate_instance'

export interface InstanceFormInput {
  name: string
  url: string
  password: string
}

export interface InstanceFormErrors {
  name?: InstanceFormErrorCode
  url?: InstanceFormErrorCode
}

export type InstanceFormResult = { ok: true; value: InstanceFormInput } | { ok: false; errors: InstanceFormErrors }

/** Checks what was typed into the instance form against the other configured instances. */
export function validateInstanceForm(input: InstanceFormInput, others: readonly Instance[]): InstanceFormResult {
  const errors: InstanceFormErrors = {}

  const name = input.name.trim().slice(0, NAME_MAX_LENGTH)
  if (!name) errors.name = 'name_required'

  let url = ''
  try {
    url = normalizeInstanceUrl(input.url)
  } catch (error) {
    errors.url = error instanceof InvalidUrlError ? `url_${error.reason}` : 'url_invalid'
  }
  if (url && others.some((other) => other.url.toLowerCase() === url.toLowerCase())) {
    errors.url = 'duplicate_instance'
  }

  if (errors.name || errors.url) return { ok: false, errors }
  return { ok: true, value: { name, url, password: input.password } }
}

/** Replaces the instance with the same id, or appends it, keeping the configured order. */
export function upsertInstance(instances: readonly Instance[], instance: Instance): Instance[] {
  if (!instances.some((entry) => entry.id === instance.id)) return [...instances, instance]
  return instances.map((entry) => (entry.id === instance.id ? instance : entry))
}
