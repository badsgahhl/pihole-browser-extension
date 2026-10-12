/** Pause presets in seconds. `0` means "until enabled again". */
export const PAUSE_PRESETS = [10, 30, 300, 1800, 3600, 0] as const

const SECOND = 1
const MINUTE = 60
const HOUR = 3600

/** Short human label for a duration in seconds: `10s`, `5m`, `1h`, `1h 30m`, `∞` for 0. */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return ''
  if (seconds === 0) return '∞'
  const h = Math.floor(seconds / HOUR)
  const m = Math.floor((seconds % HOUR) / MINUTE)
  const s = seconds % MINUTE
  const parts: string[] = []
  if (h > 0) parts.push(`${h}h`)
  if (m > 0) parts.push(`${m}m`)
  if (s > 0 || parts.length === 0) parts.push(`${s}s`)
  return parts.join(' ')
}

/** Countdown text for the popup: `mm:ss`, or `h:mm:ss` from one hour on. Never negative. */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const h = Math.floor(total / HOUR)
  const m = Math.floor((total % HOUR) / MINUTE)
  const s = total % MINUTE
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

/**
 * Countdown for the toolbar badge, at most four characters. The badge only updates once a minute,
 * so it shows minutes, not seconds: `<1m`, `4m`, `59m`, `2h`.
 */
export function formatBadgeCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  if (total < MINUTE) return '<1m'
  if (total < 100 * MINUTE) return `${Math.floor(total / MINUTE)}m`
  return `${Math.floor(total / HOUR)}h`
}

/**
 * Parses what a person types into the custom duration field. Accepts plain seconds (`90`),
 * unit suffixes (`5m`, `1h30m`, `45 s`), clock notation (`1:30`, `1:00:00`) and `∞` or `0`
 * for an indefinite pause. Returns whole seconds, or `null` when the text is not a duration.
 */
export function parseDuration(text: string): number | null {
  const raw = text.trim().toLowerCase()
  if (raw === '') return null
  if (raw === '∞' || raw === 'inf' || raw === 'infinite') return 0

  if (/^\d+$/.test(raw)) return Number(raw)

  const clock = raw.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/)
  if (clock) {
    const [, a, b, c] = clock
    if (c !== undefined) return Number(a) * HOUR + Number(b) * MINUTE + Number(c)
    return Number(a) * MINUTE + Number(b)
  }

  // Longest alternatives first, otherwise `h` would swallow the start of `hours`.
  const unitPattern = /(\d+(?:[.,]\d+)?)\s*(hours?|hrs|hr|h|minutes?|mins|min|m|seconds?|secs|sec|s)/g
  let total = 0
  let consumed = ''
  for (const match of raw.matchAll(unitPattern)) {
    const amount = Number(match[1]!.replace(',', '.'))
    const unit = match[2]!
    const factor = unit.startsWith('h') ? HOUR : unit.startsWith('m') ? MINUTE : SECOND
    total += amount * factor
    consumed += match[0]
  }
  if (consumed.replace(/\s+/g, '') !== raw.replace(/\s+/g, '')) return null
  return Math.round(total)
}
