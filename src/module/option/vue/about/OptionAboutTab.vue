<template>
    <b-card-text>
        <h2 class="pb-3 mt-0">{{translate(i18nOptionsKeys.options_about)}}</h2>
        <OptionAboutExtension></OptionAboutExtension>
        <OptionAboutReportIssue></OptionAboutReportIssue>
        <OptionAboutLicenses></OptionAboutLicenses>
    </b-card-text>
</template>

<script lang="ts">
	import {Component, Prop} from "vue-property-decorator";
	import Vue from "vue";
	import {i18nOptionsKeys, i18nService} from "../../../../service/browser/i18nService";
	import OptionAboutLicenses from "./OptionAboutLicenses.vue";
	import OptionAboutExtension from "./OptionAboutExtension.vue";
	import OptionAboutReportIssue from "./OptionAboutReportIssue.vue";

	@Component({
					  components: {OptionAboutReportIssue, OptionAboutExtension, OptionAboutLicenses}
				  })
	export default class OptionAboutTab extends Vue
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
	}
</script>

<style lang="scss" scoped>
.card {
    margin-bottom: 2rem;
}
</style>
