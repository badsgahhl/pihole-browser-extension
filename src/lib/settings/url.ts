export type InvalidUrlReason = 'empty' | 'scheme' | 'invalid'

export class InvalidUrlError extends Error {
  readonly reason: InvalidUrlReason

  constructor(reason: InvalidUrlReason, input: string) {
    super(`Invalid Pi-hole address (${reason}): ${input}`)
    this.name = 'InvalidUrlError'
    this.reason = reason
  }
}

/**
 * Turns whatever a person typed or v4 stored into the canonical instance URL: scheme, host, port and
 * an optional reverse-proxy sub-path, without `/admin`, `/api`, a trailing slash, query or hash.
 *
 *   http://pi.hole/admin              -> http://pi.hole
 *   192.168.178.20:9802/              -> http://192.168.178.20:9802
 *   https://home.example/pihole/admin -> https://home.example/pihole
 */
export function normalizeInstanceUrl(raw: string): string {
  // v4 silently removed whitespace; pasted addresses often carry a stray space.
  const input = raw.replace(/\s+/g, '')
  if (input === '') throw new InvalidUrlError('empty', raw)

  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(input) ? input : `http://${input}`
  let url: URL
  try {
    url = new URL(withScheme)
  } catch {
    throw new InvalidUrlError('invalid', raw)
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new InvalidUrlError('scheme', raw)
  if (url.hostname === '') throw new InvalidUrlError('invalid', raw)

  let path = url.pathname.replace(/\/+$/, '')
  path = path.replace(/\/(admin|api)(\/.*)?$/i, '')
  path = path.replace(/\/+$/, '')

  return `${url.origin}${path}`
}

/** `http://pi.hole:8080/pihole` -> `http://pi.hole:8080` */
export function instanceOrigin(url: string): string {
  return new URL(url).origin
}

/** `http://pi.hole:8080/pihole` -> `pi.hole` */
export function instanceHostname(url: string): string {
  return new URL(url).hostname
}

/** Match pattern for `browser.permissions`: `http://pi.hole:8080/*` */
export function originPattern(url: string): string {
  return `${instanceOrigin(url)}/*`
}

/** Base URL of the REST API: `http://pi.hole:8080/pihole/api` */
export function apiBaseUrl(url: string): string {
  return `${url}/api`
}
