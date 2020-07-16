<template>
    <b-card class="shadow" no-body>
        <b-card-header class="h6">💥 {{translate(i18nOptionsKeys.options_report_error)}}</b-card-header>
        <b-card-body>
            <p>
                <b-button size="small" target="_blank"
                          href="https://github.com/badsgahhl/pihole-browser-extension/issues"
                          class="text-light font-weight-bold">
                    {{translate(i18nOptionsKeys.option_report_error_github)}}
                </b-button>
            </p>
            <p>{{translate(i18nOptionsKeys.option_about_copy_debug)}}</p>
            <p ref="versionInfo" class="float-left">
                Switch for PiHole: {{extension_version}}
                <br>Operating System: {{plattform}}
                <br>Browser: {{browser}}
            </p>
            <b-button @click="copy_to_clipboard" type="success" class="btn btn btn-sm btn-primary ml-3">
                <b-icon-clipboard></b-icon-clipboard>
            </b-button>
        </b-card-body>
    </b-card>
</template>

<script lang="ts">
	import Vue from "vue";
	import {Component, Prop} from "vue-property-decorator";
	import {i18nOptionsKeys, i18nService} from "../../../../service/browser/i18nService";

	@Component
	export default class OptionAboutReportIssue extends Vue
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

		private get extension_version(): string
		{
			return chrome.runtime.getManifest().version;
		}

		private get plattform(): string
		{
			return window.navigator.platform;
		}

		private get browser(): string
		{
			if (navigator.userAgent.indexOf('Firefox') > -1)
			{
				return 'Mozilla Firefox ' + navigator.userAgent.substr(navigator.userAgent.lastIndexOf('/') + 1);
			}
			else if (navigator.userAgent.indexOf('Edg') > -1)
			{
				let startPos = navigator.userAgent.indexOf('Edg');
				startPos = navigator.userAgent.indexOf('/', startPos) + 1;
				const version = navigator.userAgent.substring(startPos);
				return 'Microsoft Edge ' + version;
			}
			else if (navigator.userAgent.indexOf('Chrome') > -1)
			{
				let startPos = navigator.userAgent.indexOf('Chrome');
				startPos = navigator.userAgent.indexOf('/', startPos) + 1;
				const version = navigator.userAgent.substring(startPos, navigator.userAgent.indexOf('Safari'));
				return 'Chrome/Chromium ' + version;
			}

			return 'Other/Unknown';
		}

		private copy_to_clipboard(): void
		{
			navigator.clipboard.writeText((<HTMLElement> this.$refs.versionInfo).innerText);
		}
	}
</script>
