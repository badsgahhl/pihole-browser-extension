<template>
    <div id="option">
        <b-tabs nav-class="bg-dark sidebar-nav" active-nav-item-class="bg-light text-dark" pills card vertical
                nav-wrapper-class="sidebar mr-5">
            <template v-slot:tabs-start>
                <b-row class="mb-3">
                    <b-img width="60px" height="60px" src="icon/icon-128.png"></b-img>
                    <h5 class="mt-3 text-light">Switch for PiHole</h5>
                </b-row>
            </template>
            <b-tab title-link-class="text-light" class="w-75"
                   :title="'⚙️   '+translate(i18nOptionsKeys.options_settings)"
                   active>
                <OptionGeneralSettings></OptionGeneralSettings>
            </b-tab>
            <b-tab title-link-class="text-light" class="w-75"
                   :title="'📚    '+translate(i18nOptionsKeys.options_about)">
                <OptionAboutTab></OptionAboutTab>
            </b-tab>
            <template v-slot:tabs-end>
                <b-nav-item link-classes="text-light"
                            href="https://github.com/badsgahhl/pihole-browser-extension#troubleshooting"
                            role="presentation" target="_blank">🧯 {{translate(i18nOptionsKeys.option_troubleshooting)}}
                </b-nav-item>
                <footer style="bottom: 10px"
                        class="d-md-flex px-3 mt-4 mb-1 text-uppercase position-absolute small text-muted">
                    (C) 2020 - Pascal Glaser
                </footer>
            </template>
        </b-tabs>
    </div>

</template>

<script lang="ts">
	import Vue from 'vue';
	import {Component, Prop} from 'vue-property-decorator';
	import {i18nOptionsKeys, i18nService} from "../../../service/browser/i18nService";
	import OptionGeneralSettings from "./settings/OptionGeneralSettings.vue";
	import OptionAboutTab from "./about/OptionAboutTab.vue";

	@Component({
					  components: {
						  OptionAboutTab,
						  OptionGeneralSettings,

					  }
				  })
	/**
	 * The main option component.
	 **/
	export default class OptionComponent extends Vue
	{
		@Prop({default: () => i18nOptionsKeys})
		i18nOptionsKeys!: typeof i18nOptionsKeys;

		/**
		 * Wrapper for translation
		 * @param string
		 */
		translate(string: i18nOptionsKeys): string
		{
			return i18nService.translate(string);
		}

		mounted()
		{
			this.set_site_title();
		}

		/**
		 * Sets the page title
		 */
		private set_site_title(): void
		{
			document.title = this.translate(i18nOptionsKeys.options_title);
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
