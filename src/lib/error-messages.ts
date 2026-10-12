import { i18n } from '#i18n'

import type { PiholeErrorData } from './pihole/errors'

/** Pi-hole's message plus its hint, which carries the actual reason (an SQLite error, a config key). */
function detail(error: PiholeErrorData): string {
  return error.hint ? `${error.message} · ${error.hint}` : error.message
}

/**
 * Name of the Pi-hole an error came from, when there is more than one so the name adds information.
 * `null` for a single Pi-hole or an error without origin.
 */
export function errorSourceName(
  error: PiholeErrorData | null | undefined,
  instances: ReadonlyArray<{ id: string; name: string }> | undefined
): string | null {
  if (!error?.instanceId || !instances || instances.length < 2) return null
  return instances.find((instance) => instance.id === error.instanceId)?.name ?? null
}

/** Human readable, translated text for an error coming from the background. */
export function errorMessage(error: PiholeErrorData): string {
  switch (error.kind) {
    case 'unreachable':
      return i18n.t('errors.unreachable')
    case 'timeout':
      return i18n.t('errors.timeout')
    case 'permission':
      return i18n.t('errors.permission')
    case 'unauthorized':
      return i18n.t('errors.unauthorized')
    case 'seats':
      return i18n.t('errors.seats')
    case 'rate_limited':
      return i18n.t('errors.rate_limited')
    case 'duplicate':
      return i18n.t('errors.duplicate')
    case 'regex':
      return i18n.t('errors.regex')
    case 'bad_request':
      return i18n.t('errors.bad_request', [detail(error)])
    case 'not_found':
      return i18n.t('errors.not_found')
    case 'not_pihole':
      return i18n.t('errors.not_pihole', [error.hint ?? ''])
    case 'http':
      return i18n.t('errors.http', [String(error.status ?? '')])
    case 'unknown':
      return i18n.t('errors.unknown', [detail(error)])
  }
}

/** Short status word for an instance chip or row. */
export function statusLabel(error: PiholeErrorData | null, blocking: 'enabled' | 'disabled' | null): string {
  if (error) {
    switch (error.kind) {
      case 'unreachable':
        return i18n.t('status.unreachable')
      case 'timeout':
        return i18n.t('status.timeout')
      case 'unauthorized':
        return i18n.t('status.unauthorized')
      case 'permission':
        return i18n.t('status.permission')
      case 'seats':
        return i18n.t('status.seats')
      default:
        return i18n.t('status.unknown')
    }
  }
  if (blocking === 'enabled') return i18n.t('status.enabled')
  if (blocking === 'disabled') return i18n.t('status.paused')
  return i18n.t('status.unknown')
}

/** Turns whatever a rejected `sendMessage` gives us into error data. */
export function errorDataFrom(error: unknown): PiholeErrorData {
  if (
    typeof error === 'object' &&
    error !== null &&
    'kind' in error &&
    typeof (error as PiholeErrorData).kind === 'string'
  ) {
    return error as PiholeErrorData
  }
  return { kind: 'unknown', message: error instanceof Error ? error.message : String(error) }
}
