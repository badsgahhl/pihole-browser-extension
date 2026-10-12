<template>
  <AlertDialog :open="open" @update:open="emit('update:open', $event)">
    <AlertDialogContent class="bg-card border-border max-w-[400px] gap-3 rounded-sm p-5 shadow-none">
      <AlertDialogHeader class="gap-1 text-left">
        <AlertDialogTitle class="text-sm font-semibold">{{ title }}</AlertDialogTitle>
        <AlertDialogDescription class="text-muted-foreground text-[12.5px]">{{ text }}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter class="flex-row justify-end gap-1.5">
        <AlertDialogCancel :class="cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'mt-0')">
          {{ t('common.cancel') }}
        </AlertDialogCancel>
        <AlertDialogAction
          :class="buttonVariants({ variant: destructive ? 'destructive' : 'default', size: 'sm' })"
          @click="emit('confirm')"
        >
          {{ confirmLabel }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<script setup lang="ts">
import { i18n } from '#i18n'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

defineProps<{ open: boolean; title: string; text: string; confirmLabel: string; destructive?: boolean }>()
const emit = defineEmits<{ 'update:open': [open: boolean]; confirm: [] }>()

const t = i18n.t
</script>
