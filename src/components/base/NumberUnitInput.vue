<template>
  <div class="flex gap-1">
    <input
      :id="id"
      v-model.number="amount"
      type="number"
      :min="min"
      inputmode="numeric"
      :aria-label="label"
      class="border-input bg-background text-foreground focus-visible:ring-ring focus-visible:ring-offset-background box-border h-[30px] w-16 rounded-sm border px-2 text-right font-mono text-[12.5px] outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
      @change="commit"
    />
    <select
      v-model="unit"
      :aria-label="unitLabel"
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
import { ref, watch } from 'vue'

import { i18n } from '#i18n'

type Unit = 'seconds' | 'minutes' | 'hours'

const FACTORS: Record<Unit, number> = { seconds: 1, minutes: 60, hours: 3600 }

const props = withDefaults(
  defineProps<{ modelValue: number; label: string; unitLabel?: string; id?: string; min?: number }>(),
  { unitLabel: 'Unit', id: undefined, min: 1 }
)

const emit = defineEmits<{ 'update:modelValue': [seconds: number] }>()

const t = i18n.t

function largestUnit(seconds: number): Unit {
  if (seconds > 0 && seconds % 3600 === 0) return 'hours'
  if (seconds > 0 && seconds % 60 === 0) return 'minutes'
  return 'seconds'
}

const unit = ref<Unit>(largestUnit(props.modelValue))
const amount = ref<number>(Math.round(props.modelValue / FACTORS[unit.value]))

watch(
  () => props.modelValue,
  (seconds) => {
    if (seconds === amount.value * FACTORS[unit.value]) return
    unit.value = largestUnit(seconds)
    amount.value = Math.round(seconds / FACTORS[unit.value])
  }
)

function commit() {
  const value = Number(amount.value)
  if (!Number.isFinite(value) || value < props.min) return
  emit('update:modelValue', Math.round(value * FACTORS[unit.value]))
}
</script>
