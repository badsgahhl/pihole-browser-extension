<script lang="ts">
	import Vue from "vue";
  import {Component, Prop} from "vue-property-decorator";
	import {i18nOptionsKeys, i18nPopupKeys, i18nService, LinkConfig} from "../../service/browser/i18nService";
	import {PiHoleSettingsDefaults} from "../../service/browser/StorageService";

	@Component
	export default abstract class BaseComponent extends Vue
	{

		@Prop({default: () => i18nOptionsKeys})
		i18nOptionsKeys!: typeof i18nOptionsKeys;

		@Prop({default: () => i18nPopupKeys})
		i18nPopupKeys!: typeof i18nPopupKeys;

		@Prop({default: () => LinkConfig})
		LinkConfig!: typeof LinkConfig;

		@Prop({default: () => PiHoleSettingsDefaults})
		PiHoleSettingsDefaults!: typeof PiHoleSettingsDefaults;

		/**
		 * Wrapper for translation
		 * @param string
		 */
		protected translate(string: string, substitutions?: any): string
		{
			return i18nService.translate(string, substitutions);
		}

	}
</script>
