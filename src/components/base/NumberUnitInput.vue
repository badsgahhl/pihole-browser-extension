<template>
  <div class="flex gap-1">
    <BaseInput
      :id="id"
      v-model="amount"
      mono
      type="number"
      :min="min"
      inputmode="numeric"
      :aria-label="label"
      class="h-[30px] w-16 px-2 text-right"
      @change="commit"
    />
    <select
      v-model="unit"
      :aria-label="unitLabel ?? t('options.general.units.label')"
      class="border-input bg-secondary text-foreground focus-visible:ring-ring focus-visible:ring-offset-background box-border h-[30px] rounded-sm border px-2 text-[12.5px] outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
      @change="commit"
    >
      <option value="seconds">{{ t('options.general.units.seconds') }}</option>
      <option value="minutes">{{ t('options.general.units.minutes') }}</option>
      <option value="hours">{{ t('options.general.units.hours') }}</option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { shallowRef, watch } from 'vue'

import { i18n } from '#i18n'

import BaseInput from './BaseInput.vue'

type Unit = 'seconds' | 'minutes' | 'hours'

const FACTORS: Record<Unit, number> = { seconds: 1, minutes: 60, hours: 3600 }

const props = withDefaults(defineProps<{ label: string; unitLabel?: string; id?: string; min?: number }>(), {
  unitLabel: undefined,
  id: undefined,
  min: 1
})
/** Seconds. The amount and unit shown are derived from it and written back on change. */
const model = defineModel<number>({ required: true })

const t = i18n.t

function largestUnit(seconds: number): Unit {
  if (seconds > 0 && seconds % 3600 === 0) return 'hours'
  if (seconds > 0 && seconds % 60 === 0) return 'minutes'
  return 'seconds'
}

const unit = shallowRef<Unit>(largestUnit(model.value))
const amount = shallowRef(String(Math.round(model.value / FACTORS[unit.value])))

watch(model, (seconds) => {
  if (seconds === Number(amount.value) * FACTORS[unit.value]) return
  unit.value = largestUnit(seconds)
  amount.value = String(Math.round(seconds / FACTORS[unit.value]))
})

function commit() {
  const value = Number(amount.value)
  if (!Number.isFinite(value) || value < props.min) return
  model.value = Math.round(value * FACTORS[unit.value])
}
</script>
