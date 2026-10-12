import { i18n } from '#i18n'
import { browser } from '#imports'

import { formatBadgeCountdown, formatCountdown } from './duration'
import type { BadgeMode } from './settings/schema'
import type { ExtensionState } from './state'

export interface BadgeSpec {
  text: string
  color: string
  title: string
}

/** Fixed badge colours, chosen for white text on both light and dark toolbars. */
export const BADGE_COLORS = {
  on: '#1b7a3e',
  paused: '#875900',
  off: '#5a6371',
  error: '#c4102b',
  info: '#4577d7'
} as const

export function computeBadge(state: ExtensionState, mode: BadgeMode, now = Date.now()): BadgeSpec {
  const name = i18n.t('popup.title')
  const empty = { text: '', color: BADGE_COLORS.off, title: name }
  if (mode === 'off') return empty

  switch (state.overall) {
    case 'needs-setup':
      return { text: i18n.t('badge.info'), color: BADGE_COLORS.info, title: i18n.t('badge.title.needsSetup') }
    case 'needs-permission':
      return {
        text: i18n.t('badge.info'),
        color: BADGE_COLORS.info,
        title: i18n.t('badge.title.needsPermission')
      }
    case 'error': {
      const unauthorized = state.instances.some(
        (instance) => instance.error?.kind === 'unauthorized' || instance.error?.kind === 'seats'
      )
      return unauthorized
        ? { text: i18n.t('badge.info'), color: BADGE_COLORS.info, title: i18n.t('badge.title.unauthorized') }
        : { text: i18n.t('badge.error'), color: BADGE_COLORS.error, title: i18n.t('badge.title.unreachable') }
    }
    case 'mixed':
      return { text: i18n.t('badge.mixed'), color: BADGE_COLORS.paused, title: i18n.t('badge.title.mixed') }
    case 'paused': {
      if (state.timerEndsAt === null || state.pausedIndefinitely) {
        return { text: i18n.t('badge.off'), color: BADGE_COLORS.off, title: i18n.t('badge.title.pausedIndefinitely') }
      }
      const remaining = state.timerEndsAt - now
      return {
        text: formatBadgeCountdown(remaining),
        color: BADGE_COLORS.paused,
        title: i18n.t('badge.title.paused', [formatCountdown(remaining)])
      }
    }
    case 'enabled': {
      const percent = state.percentBlocked
      const text = mode === 'percent' && percent !== null ? `${Math.round(percent)}%` : i18n.t('badge.on')
      const title =
        percent !== null
          ? i18n.t('badge.title.enabledStats', [String(Math.round(percent))])
          : i18n.t('badge.title.enabled')
      return { text, color: BADGE_COLORS.on, title }
    }
  }
}

export async function applyBadge(state: ExtensionState, mode: BadgeMode): Promise<void> {
  const spec = computeBadge(state, mode)
  const action = browser.action
  await action.setBadgeText({ text: spec.text })
  await action.setBadgeBackgroundColor({ color: spec.color })
  if (typeof action.setBadgeTextColor === 'function') {
    try {
      await action.setBadgeTextColor({ color: '#ffffff' })
    } catch {
      // Older browsers pick the text colour themselves.
    }
  }
  await action.setTitle({ title: spec.title })
}
