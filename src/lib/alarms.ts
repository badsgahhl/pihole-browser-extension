import { browser } from '#imports'

import type { ExtensionState } from './state'

export const ALARM_STATUS = 'status-refresh'
export const ALARM_PAUSE_END = 'pause-end'
export const TEMP_ALLOW_PREFIX = 'temp-allow:'

/** Chrome MV3 allows no periodic alarm below one minute. */
export const STATUS_PERIOD_MINUTES = 1

export async function ensureStatusAlarm(): Promise<void> {
  const existing = await browser.alarms.get(ALARM_STATUS)
  if (existing) return
  await browser.alarms.create(ALARM_STATUS, { periodInMinutes: STATUS_PERIOD_MINUTES })
}

/** Fires right after the earliest running pause ends so the badge and the tab follow promptly. */
export async function schedulePauseEnd(state: ExtensionState): Promise<void> {
  const ends = state.instances
    .map((instance) => instance.timerEndsAt)
    .filter((end): end is number => end !== null && end > Date.now())
  await browser.alarms.clear(ALARM_PAUSE_END)
  if (ends.length === 0) return
  await browser.alarms.create(ALARM_PAUSE_END, { when: Math.min(...ends) + 500 })
}

export function tempAllowAlarmName(id: string): string {
  return `${TEMP_ALLOW_PREFIX}${id}`
}

export function tempAllowIdFromAlarm(name: string): string | null {
  return name.startsWith(TEMP_ALLOW_PREFIX) ? name.slice(TEMP_ALLOW_PREFIX.length) : null
}

export async function scheduleTempAllowExpiry(id: string, when: number): Promise<void> {
  await browser.alarms.create(tempAllowAlarmName(id), { when: Math.max(when, Date.now() + 1000) })
}

export async function clearTempAllowAlarm(id: string): Promise<void> {
  await browser.alarms.clear(tempAllowAlarmName(id))
}
