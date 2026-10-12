import { computed, type MaybeRefOrGetter, onScopeDispose, ref, toValue, watch } from 'vue'

import { formatCountdown } from '@/lib/duration'

/** Ticks once a second while a pause is running, so the popup can show `mm:ss`. */
export function useCountdown(endsAt: MaybeRefOrGetter<number | null>) {
  const now = ref(Date.now())
  let timer: ReturnType<typeof setInterval> | undefined

  function stop() {
    if (timer !== undefined) clearInterval(timer)
    timer = undefined
  }

  watch(
    () => toValue(endsAt),
    (ends) => {
      stop()
      now.value = Date.now()
      if (ends !== null && ends > now.value) {
        timer = setInterval(() => {
          now.value = Date.now()
          if (now.value >= ends) stop()
        }, 1000)
      }
    },
    { immediate: true }
  )

  onScopeDispose(stop)

  const remainingMs = computed(() => {
    const ends = toValue(endsAt)
    return ends === null ? null : Math.max(0, ends - now.value)
  })
  const text = computed(() => (remainingMs.value === null ? '' : formatCountdown(remainingMs.value)))
  const expired = computed(() => remainingMs.value === 0)

  return { remainingMs, text, expired }
}
