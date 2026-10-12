import { useNow, useTimeoutPoll } from '@vueuse/core'
import { computed, type MaybeRefOrGetter, toValue, watch } from 'vue'

import { formatCountdown } from '@/lib/duration'

/**
 * Ticks once a second while a pause is running, so the popup can show `mm:ss`. Built on the wall
 * clock (`useNow`): the end is an absolute time from the background, and a throttled popup must
 * not drift away from it the way a tick counter would.
 */
export function useCountdown(endsAt: MaybeRefOrGetter<number | null>) {
  const clock = useNow({
    controls: true,
    scheduler: (update) => useTimeoutPoll(update, 1000, { immediate: false })
  })

  const remainingMs = computed(() => {
    const ends = toValue(endsAt)
    return ends === null ? null : Math.max(0, ends - clock.now.value.getTime())
  })

  watch(
    () => toValue(endsAt),
    (ends) => {
      clock.now.value = new Date()
      if (ends !== null && ends > clock.now.value.getTime()) clock.resume()
      else clock.pause()
    },
    { immediate: true }
  )
  watch(remainingMs, (ms) => {
    if (ms === 0) clock.pause()
  })

  const text = computed(() => (remainingMs.value === null ? '' : formatCountdown(remainingMs.value)))
  const expired = computed(() => remainingMs.value === 0)

  return { remainingMs, text, expired }
}
