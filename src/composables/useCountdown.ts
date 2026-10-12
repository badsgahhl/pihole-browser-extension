import { useIntervalFn } from '@vueuse/core'
import { computed, type MaybeRefOrGetter, shallowRef, toValue, watch } from 'vue'

import { formatCountdown } from '@/lib/duration'

/**
 * Ticks once a second while a pause is running, so the popup can show `mm:ss`. Each tick reads the
 * wall clock rather than counting down: the end is an absolute time from the background, and a
 * throttled popup must not drift away from it.
 */
export function useCountdown(endsAt: MaybeRefOrGetter<number | null>) {
  const now = shallowRef(Date.now())

  const ticker = useIntervalFn(
    () => {
      now.value = Date.now()
      const ends = toValue(endsAt)
      if (ends === null || now.value >= ends) ticker.pause()
    },
    1000,
    { immediate: false }
  )

  watch(
    () => toValue(endsAt),
    (ends) => {
      now.value = Date.now()
      if (ends !== null && ends > now.value) ticker.resume()
      else ticker.pause()
    },
    { immediate: true }
  )

  const remainingMs = computed(() => {
    const ends = toValue(endsAt)
    return ends === null ? null : Math.max(0, ends - now.value)
  })
  const text = computed(() => (remainingMs.value === null ? '' : formatCountdown(remainingMs.value)))
  const expired = computed(() => remainingMs.value === 0)

  return { remainingMs, text, expired }
}
