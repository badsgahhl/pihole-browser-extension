<template>
  <nav
    :aria-label="t('options.nav.label')"
    class="bg-sidebar border-border flex min-w-[200px] flex-[0_1_232px] flex-col gap-1 border-r px-3 py-4"
  >
    <div class="flex items-center gap-2.5 px-2 pt-1 pb-3.5">
      <BrandMark :size="24" />
      <div>
        <div class="text-sm leading-tight font-semibold">{{ t('popup.title') }}</div>
        <div class="text-muted-foreground font-mono text-[10.5px]">v{{ version }}</div>
      </div>
    </div>

    <RouterLink v-for="item in items" :key="item.to" v-slot="{ href, navigate, isActive }" :to="item.to" custom>
      <a
        :href="href"
        :aria-current="isActive ? 'page' : undefined"
        :class="
          cn(
            'focus-visible:ring-ring flex h-8 items-center gap-2.5 rounded-sm border px-2.5 no-underline outline-none focus-visible:ring-2',
            isActive
              ? 'border-border-strong bg-secondary text-foreground font-semibold'
              : 'text-ink-2 hover:bg-secondary hover:text-foreground border-transparent font-medium'
          )
        "
        @click="navigate"
      >
        <component :is="item.icon" class="size-[15px]" aria-hidden="true" />
        {{ item.label }}
      </a>
    </RouterLink>

    <div class="flex-1" />

    <a
      v-for="link in externalLinks"
      :key="link.href"
      :href="link.href"
      target="_blank"
      rel="noreferrer"
      class="text-muted-foreground hover:text-foreground focus-visible:ring-ring flex h-[30px] items-center gap-2.5 rounded-sm px-2.5 text-xs font-medium outline-none focus-visible:ring-2"
    >
      <component :is="link.icon" class="size-3.5" aria-hidden="true" />
      {{ link.label }}
    </a>
    <div class="text-ink-4 px-2.5 pt-2.5 text-[10.5px]">{{ t('options.nav.copyright', [String(year)]) }}</div>
  </nav>
</template>

<script setup lang="ts">
import { BugIcon, GiftIcon, InfoIcon, KeyboardIcon, ServerIcon, SlidersVerticalIcon } from '@lucide/vue'
import { RouterLink } from 'vue-router'

import { i18n } from '#i18n'
import BrandMark from '@/components/base/BrandMark.vue'
import { DONATE_URL, NEW_ISSUE_URL } from '@/lib/links'
import { cn } from '@/lib/utils'

defineProps<{ version: string }>()

const t = i18n.t
const year = new Date().getFullYear()

const items = [
  { to: '/pi-holes', label: t('options.nav.instances'), icon: ServerIcon },
  { to: '/general', label: t('options.nav.general'), icon: SlidersVerticalIcon },
  { to: '/shortcuts', label: t('options.nav.shortcuts'), icon: KeyboardIcon },
  { to: '/about', label: t('options.nav.about'), icon: InfoIcon }
]

const externalLinks = [
  { href: DONATE_URL, label: t('options.nav.donate'), icon: GiftIcon },
  { href: NEW_ISSUE_URL, label: t('options.nav.issue'), icon: BugIcon }
]
</script>
