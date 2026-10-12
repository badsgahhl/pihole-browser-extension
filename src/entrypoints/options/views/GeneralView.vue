<template>
  <PageHeader :title="t('options.general.title')" :intro="t('options.general.intro')" />

  <p v-if="failure" role="alert" class="text-destructive text-xs">{{ failure }}</p>

  <template v-if="settings">
    <BasePanel :label="t('options.general.popup')">
      <PanelHead>{{ t('options.general.popup') }}</PanelHead>
      <SettingRow
        :title="t('options.general.pauseDefault.title')"
        :text="t('options.general.pauseDefault.text')"
        for-id="pause-default"
      >
        <NumberUnitInput
          id="pause-default"
          :model-value="settings.pause.defaultSeconds"
          :label="t('options.general.pauseDefault.title')"
          :unit-label="t('options.general.units.label')"
          @update:model-value="update({ pause: { ...settings.pause, defaultSeconds: $event } })"
        />
      </SettingRow>
      <SettingRow :title="t('options.general.rememberLast.title')" :text="t('options.general.rememberLast.text')">
        <BaseSwitch
          size="sm"
          :model-value="settings.pause.rememberLast"
          :label="t('options.general.rememberLast.title')"
          @update:model-value="update({ pause: { ...settings.pause, rememberLast: $event } })"
        />
      </SettingRow>
      <SettingRow :title="t('options.general.showSite.title')" :text="t('options.general.showSite.text')">
        <BaseSwitch
          size="sm"
          :model-value="settings.showCurrentSite"
          :label="t('options.general.showSite.title')"
          @update:model-value="update({ showCurrentSite: $event })"
        />
      </SettingRow>
      <SettingRow
        :title="t('options.general.reloadAfterPause.title')"
        :text="t('options.general.reloadAfterPause.text')"
      >
        <BaseSwitch
          size="sm"
          :model-value="settings.reloadAfterPause"
          :label="t('options.general.reloadAfterPause.title')"
          @update:model-value="update({ reloadAfterPause: $event })"
        />
      </SettingRow>
      <SettingRow
        :title="t('options.general.reloadAfterAllow.title')"
        :text="t('options.general.reloadAfterAllow.text')"
      >
        <BaseSwitch
          size="sm"
          :model-value="settings.reloadAfterAllow"
          :label="t('options.general.reloadAfterAllow.title')"
          @update:model-value="update({ reloadAfterAllow: $event })"
        />
      </SettingRow>
    </BasePanel>

    <div class="grid gap-4 md:grid-cols-2">
      <BasePanel :label="t('options.general.badge.title')">
        <PanelHead>{{ t('options.general.badge.title') }}</PanelHead>
        <div class="flex flex-col gap-2.5 px-3.5 py-3">
          <SegmentedControl
            :model-value="settings.badgeMode"
            :options="badgeOptions"
            :label="t('options.general.badge.mode')"
            @update:model-value="update({ badgeMode: $event })"
          />
          <BadgePreview />
        </div>
      </BasePanel>

      <BasePanel :label="t('options.general.integration')">
        <PanelHead>{{ t('options.general.integration') }}</PanelHead>
        <SettingRow :title="t('options.general.contextMenu.title')" :text="t('options.general.contextMenu.text')">
          <BaseSwitch
            size="sm"
            :model-value="settings.contextMenu"
            :label="t('options.general.contextMenu.title')"
            @update:model-value="update({ contextMenu: $event })"
          />
        </SettingRow>
        <SettingRow :title="t('options.general.theme.title')" :text="t('options.general.theme.text')">
          <SegmentedControl
            size="sm"
            class="w-[180px] shrink-0"
            :model-value="settings.theme"
            :options="themeOptions"
            :label="t('options.general.theme.title')"
            @update:model-value="update({ theme: $event })"
          />
        </SettingRow>
      </BasePanel>
    </div>

    <BasePanel :label="t('options.general.data')">
      <PanelHead>{{ t('options.general.data') }}</PanelHead>
      <DataActions />
    </BasePanel>
  </template>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import { i18n } from '#i18n'
import BasePanel from '@/components/base/BasePanel.vue'
import BaseSwitch from '@/components/base/BaseSwitch.vue'
import NumberUnitInput from '@/components/base/NumberUnitInput.vue'
import SegmentedControl, { type SegmentOption } from '@/components/base/SegmentedControl.vue'
import BadgePreview from '@/components/options/BadgePreview.vue'
import DataActions from '@/components/options/DataActions.vue'
import PageHeader from '@/components/options/PageHeader.vue'
import PanelHead from '@/components/options/PanelHead.vue'
import SettingRow from '@/components/options/SettingRow.vue'
import { useSettings } from '@/composables/useSettings'
import { errorDataFrom, errorMessage } from '@/lib/error-messages'
import type { BadgeMode, Settings, Theme } from '@/lib/settings/schema'

const t = i18n.t
const { settings, save } = useSettings()
const failure = ref('')

const badgeOptions: SegmentOption<BadgeMode>[] = [
  { value: 'off', label: t('options.general.badge.off') },
  { value: 'state', label: t('options.general.badge.state') },
  { value: 'percent', label: t('options.general.badge.percent') }
]

const themeOptions: SegmentOption<Theme>[] = [
  { value: 'system', label: t('options.general.theme.system') },
  { value: 'light', label: t('options.general.theme.light') },
  { value: 'dark', label: t('options.general.theme.dark') }
]

/** Every control saves on change; the background applies menus, badge and theme right away. */
async function update(partial: Partial<Settings>): Promise<void> {
  failure.value = ''
  try {
    await save(partial)
  } catch (error) {
    failure.value = errorMessage(errorDataFrom(error))
  }
}
</script>
