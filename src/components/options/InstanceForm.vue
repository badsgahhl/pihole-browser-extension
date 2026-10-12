<template>
  <section
    :aria-label="heading"
    class="bg-card border-border-strong grid rounded-sm border md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"
  >
    <form class="border-border flex flex-col gap-3 px-[18px] py-4 md:border-r" novalidate @submit.prevent="save">
      <PanelHeading>{{ heading }}</PanelHeading>

      <FormField :label="t('options.instances.name')" for-id="instance-name" :error="errorText(errors.name)">
        <BaseInput
          id="instance-name"
          v-model="form.name"
          :maxlength="NAME_MAX_LENGTH"
          autocomplete="off"
          :aria-invalid="errors.name ? 'true' : undefined"
          :aria-describedby="errors.name ? 'instance-name-error' : undefined"
        />
      </FormField>

      <FormField
        :label="t('options.instances.address')"
        for-id="instance-url"
        :hint="t('options.instances.addressHint')"
        :error="errorText(errors.url)"
      >
        <BaseInput
          id="instance-url"
          v-model="form.url"
          mono
          type="text"
          inputmode="url"
          autocomplete="off"
          spellcheck="false"
          placeholder="http://pi.hole"
          :aria-invalid="errors.url ? 'true' : undefined"
          :aria-describedby="errors.url ? 'instance-url-error' : 'instance-url-hint'"
        />
      </FormField>

      <FormField
        :label="t('options.instances.password')"
        for-id="instance-password"
        :hint="t('options.instances.passwordHint')"
      >
        <div class="relative">
          <BaseInput
            id="instance-password"
            v-model="form.password"
            mono
            :type="showPassword ? 'text' : 'password'"
            autocomplete="off"
            class="pr-9"
            aria-describedby="instance-password-hint"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            class="absolute top-0.5 right-0.5"
            :aria-label="showPassword ? t('options.instances.hidePassword') : t('options.instances.showPassword')"
            :aria-pressed="showPassword"
            @click="showPassword = !showPassword"
          >
            <EyeOffIcon v-if="showPassword" />
            <EyeIcon v-else />
          </Button>
        </div>
      </FormField>

      <div class="mt-1 flex gap-1.5">
        <Button type="submit" variant="default" size="sm" :disabled="busy">{{ t('common.save') }}</Button>
        <Button type="button" variant="secondary" size="sm" :disabled="busy" @click="emit('cancel')">
          {{ t('common.cancel') }}
        </Button>
      </div>
    </form>

    <ConnectionPanel
      :phase="phase"
      :outcome="outcome"
      :status="instance ? status : null"
      :access="access"
      :host="host"
      @test="test"
    />
  </section>
</template>

<script setup lang="ts">
import { EyeIcon, EyeOffIcon } from '@lucide/vue'
import { watchDebounced } from '@vueuse/core'
import { computed, reactive, ref } from 'vue'

import { i18n } from '#i18n'
import BaseInput from '@/components/base/BaseInput.vue'
import FormField from '@/components/base/FormField.vue'
import PanelHeading from '@/components/base/PanelHeading.vue'
import { Button } from '@/components/ui/button'
import { errorDataFrom } from '@/lib/error-messages'
import { sendMessage } from '@/lib/messaging'
import { hasHostPermission, requestHostPermission } from '@/lib/permissions'
import type { InstanceTestResult } from '@/lib/pihole/actions'
import {
  type InstanceFormErrorCode,
  type InstanceFormErrors,
  type InstanceFormInput,
  NAME_MAX_LENGTH,
  upsertInstance,
  validateInstanceForm
} from '@/lib/settings/instance-form'
import { type Instance, newInstanceId } from '@/lib/settings/schema'
import { normalizeInstanceUrl } from '@/lib/settings/url'
import type { InstanceStatus } from '@/lib/state'

import ConnectionPanel, { type AccessState, type EditorPhase, type TestOutcome } from './ConnectionPanel.vue'

const props = defineProps<{
  /** The instance being edited, `null` for a new one. */
  instance: Instance | null
  /** Every configured instance, in order; the saved list is derived from it. */
  instances: Instance[]
  status: InstanceStatus | null
}>()
const emit = defineEmits<{ saved: [instance: Instance]; cancel: [] }>()

const t = i18n.t

const form = reactive<InstanceFormInput>({
  name: props.instance?.name ?? '',
  url: props.instance?.url ?? '',
  password: props.instance?.password ?? ''
})
const errors = ref<InstanceFormErrors>({})
const showPassword = ref(false)
const phase = ref<EditorPhase>('idle')
const outcome = ref<TestOutcome>({ kind: 'none' })
const access = ref<AccessState>('unknown')

const busy = computed(() => phase.value !== 'idle')
const others = computed(() => props.instances.filter((entry) => entry.id !== props.instance?.id))
const heading = computed(() =>
  props.instance ? t('options.instances.editing', [props.instance.name]) : t('options.instances.new')
)

const normalizedUrl = computed(() => {
  try {
    return normalizeInstanceUrl(form.url)
  } catch {
    return null
  }
})
const host = computed(() => (normalizedUrl.value ? new URL(normalizedUrl.value).host : ''))

watchDebounced(
  normalizedUrl,
  async (url) => {
    if (!url) {
      access.value = 'unknown'
      return
    }
    access.value = (await hasHostPermission(url)) ? 'granted' : 'pending'
  },
  { debounce: 250, immediate: true }
)

function errorText(code: InstanceFormErrorCode | undefined): string | null {
  return code ? t(`errors.${code}`) : null
}

function prepare(): InstanceFormInput | null {
  const checked = validateInstanceForm(form, others.value)
  if (!checked.ok) {
    errors.value = checked.errors
    return null
  }
  errors.value = {}
  return checked.value
}

/**
 * Asks the browser for the origin and the background for a test login. Runs synchronously up to
 * the permission request so the click or submit still counts as a user gesture.
 */
async function connect(value: InstanceFormInput): Promise<InstanceTestResult | null> {
  phase.value = 'testing'
  outcome.value = { kind: 'none' }
  try {
    const granted = await requestHostPermission(value.url)
    access.value = granted ? 'granted' : 'denied'
    if (!granted) {
      outcome.value = { kind: 'error', error: { kind: 'permission', message: 'not granted' } }
      return null
    }
    const result = await sendMessage('testInstance', { url: value.url, password: value.password })
    if (!result.ok) {
      outcome.value = { kind: 'error', error: result.error ?? { kind: 'unknown', message: '' } }
      return null
    }
    outcome.value = { kind: 'ok', result }
    return result
  } catch (error) {
    outcome.value = { kind: 'error', error: errorDataFrom(error) }
    return null
  } finally {
    if (phase.value === 'testing') phase.value = 'idle'
  }
}

async function test(): Promise<void> {
  const value = prepare()
  if (value) await connect(value)
}

async function save(): Promise<void> {
  const value = prepare()
  if (!value) return
  const result = await connect(value)
  if (!result) return
  phase.value = 'saving'
  const instance: Instance = { id: props.instance?.id ?? newInstanceId(), ...value }
  try {
    await sendMessage('saveSettings', { instances: upsertInstance(props.instances, instance) })
    emit('saved', instance)
  } catch (error) {
    outcome.value = { kind: 'error', error: errorDataFrom(error) }
  } finally {
    phase.value = 'idle'
  }
}
</script>
