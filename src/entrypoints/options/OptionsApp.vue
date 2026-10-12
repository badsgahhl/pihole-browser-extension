<template>
  <div class="bg-background text-foreground flex min-h-screen flex-wrap">
    <OptionsNav :version="version" />
    <main class="min-w-0 flex-[999_1_560px] px-8 pt-7 pb-10">
      <div class="flex max-w-[880px] flex-col gap-4">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useTitle } from '@vueuse/core'
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'

import { i18n } from '#i18n'
import { browser } from '#imports'
import OptionsNav from '@/components/options/OptionsNav.vue'
import { provideExtensionState } from '@/composables/useExtensionState'
import { provideSettings } from '@/composables/useSettings'
import { useTheme } from '@/composables/useTheme'

import type { SectionName } from './router'

const t = i18n.t
const route = useRoute()
// Provided once here, so every view shares one storage subscription and one state request.
const { settings } = provideSettings()
provideExtensionState()
const version = browser.runtime.getManifest().version

useTheme(computed(() => settings.value?.theme))

const SECTION_TITLES: Record<SectionName, () => string> = {
  instances: () => t('options.nav.instances'),
  general: () => t('options.nav.general'),
  shortcuts: () => t('options.nav.shortcuts'),
  about: () => t('options.nav.about')
}

useTitle(computed(() => t('options.title', [SECTION_TITLES[route.meta.section ?? 'instances']()])))
</script>
