<template>
  <BasePanel :label="t('popup.permission.title')" tone="warning" class="mx-2.5 mt-2.5">
    <div class="flex items-center gap-2.5 px-3 py-2.5">
      <LockIcon class="text-warning size-[18px] shrink-0" aria-hidden="true" />
      <div class="min-w-0 flex-1">
        <div class="font-semibold">{{ t('popup.permission.title') }}</div>
        <p class="text-muted-foreground text-[11px]">{{ t('popup.permission.text') }}</p>
      </div>
      <Button variant="default" size="xs" @click="emit('grant')">{{ t('popup.permission.action') }}</Button>
    </div>
  </BasePanel>
</template>

<script setup lang="ts">
import { LockIcon } from '@lucide/vue'

import { i18n } from '#i18n'
import BasePanel from '@/components/base/BasePanel.vue'
import { Button } from '@/components/ui/button'

const emit = defineEmits<{ grant: [] }>()

const t = i18n.t
</script>
