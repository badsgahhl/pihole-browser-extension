<template>
  <v-app id="option">
    <b-tabs
      v-model="tab"
      active-nav-item-class="bg-light text-dark"
      card
      nav-class="bg-dark sidebar-nav"
      nav-wrapper-class="sidebar mr-5"
      pills
      vertical
    >
      <template #tabs-start>
        <b-row class="mb-3">
          <b-img height="60px" src="icon/icon-128.png" width="60px" />
          <h5 class="mt-3 text-light">
            Switch for PiHole
          </h5>
        </b-row>
      </template>
      <b-tab
        :title="'⚙️   ' + translate(i18nOptionsKeys.options_settings)"
        active
        class="w-75"
        title-link-class="text-light"
      >
        <OptionGeneralSettings />
      </b-tab>
      <b-tab
        :title="'📚    ' + translate(i18nOptionsKeys.options_about)"
        class="w-75"
        title-link-class="text-light"
      >
        <OptionAboutTab />
      </b-tab>
      <template #tabs-end>
        <b-nav-item
          :href="LinkConfig.paypal_donation_link"
          link-classes="text-light"
          role="presentation"
          target="_blank"
        >
          ❤ {{ translate(i18nOptionsKeys.option_donation) }}
        </b-nav-item>
        <b-nav-item
          :href="LinkConfig.github_troubleshooting"
          link-classes="text-light"
          role="presentation"
          target="_blank"
        >
          🧯 {{ translate(i18nOptionsKeys.option_troubleshooting) }}
        </b-nav-item>
        <footer
          class="d-md-flex px-3 mt-4 mb-1 text-uppercase position-absolute small text-muted"
          style="bottom: 10px"
        >
          {{ getCopyrightText() }}
        </footer>
      </template>
    </b-tabs>
  </v-app>
</template>

<script lang="ts">
import { Component, Watch } from 'vue-property-decorator'
import { I18NOptionKeys } from '../../../service/i18NService'
import OptionGeneralSettings from './settings/OptionGeneralSettings.vue'
import OptionAboutTab from './about/OptionAboutTab.vue'
import BaseComponent from '../../general/BaseComponent.vue'

@Component({
  components: {
    OptionAboutTab,
    OptionGeneralSettings
  }
})
/**
 * The main option component.
 * */
export default class OptionComponent extends BaseComponent {
  private tab: number = 0

  mounted() {
    this.setSiteTitle()
  }

  @Watch('tab')
  private setSiteTitle(): void {
    document.title = this.translate(I18NOptionKeys.options_title, [
      this.getTitleForTab(this.tab)
    ])
  }

  private getTitleForTab(id: number): string {
    switch (id) {
      case 0:
        return this.translate(I18NOptionKeys.options_settings)
      case 1:
        return this.translate(I18NOptionKeys.options_about)
      default:
        return 'x'
    }
  }

  private getCopyrightText(): string {
    const year = new Date().getFullYear()
    return `(C) ${year} - Pascal Glaser`
  }
}
</script>

<style lang="scss">
.headline {
  margin-bottom: 10px;

  @-moz-document url-prefix() {
    font-size: 16px;
  }
}

$sidebar-width: 240px;

.sidebar {
  width: $sidebar-width;
}

.sidebar-nav {
  position: fixed;
  bottom: 0;
  top: 0;
  width: $sidebar-width;
}

.option-body {
  max-width: 1440px;
}
</style>
