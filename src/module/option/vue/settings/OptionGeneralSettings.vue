<template>
    <b-card-text>
        <h2 class="pb-3 mt-0">{{translate(i18nOptionsKeys.options_settings)}}</h2>
        <b-card class="shadow" no-body>
            <b-card-header class="h6">👉🏼 {{translate(i18nOptionsKeys.options_headline_info)}}</b-card-header>
            <b-card-body>
                <OptionTabComponent></OptionTabComponent>

                <OptionDisableTimeComponent></OptionDisableTimeComponent>

                <OptionGenericCheckboxComponent v-for="item in checkbox_options" v-bind:key="item.key"
                                                :label_text_key="item.label_text_key"
                                                :setter_function="item.setter_function"
                                                :getter_function="item.getter_function"/>
            </b-card-body>
        </b-card>
    </b-card-text>
</template>

<script lang="ts">
	import {Component, Prop} from "vue-property-decorator";
	import Vue from "vue";
	import {i18nOptionsKeys, i18nService} from "../../../../service/browser/i18nService";
	import {StorageService} from "../../../../service/browser/StorageService";
	import OptionDisableTimeComponent from "./OptionDisableTimeComponent.vue";
	import OptionTabComponent from "./OptionTabComponent.vue";
	import OptionGenericCheckboxComponent from "./OptionGenericCheckboxComponent.vue";

	@Component({
					  components: {
						  OptionDisableTimeComponent, OptionTabComponent, OptionGenericCheckboxComponent
					  }
				  })
	export default class OptionGeneralSettings extends Vue
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

		/**
		 * Gets an array of checkbox options
		 */
		get checkbox_options(): GenericCheckboxComponent[]
		{
			return [
				{
					label_text_key: i18nOptionsKeys.options_reload_after_disable,
					getter_function: StorageService.get_reload_after_disable,
					setter_function: StorageService.save_reload_after_disable
				},
				{
					label_text_key: i18nOptionsKeys.options_reload_after_white_list,
					getter_function: StorageService.get_reload_after_white_list,
					setter_function: StorageService.save_reload_after_white_list
				},
				{
					label_text_key: i18nOptionsKeys.options_beta_feature_flag,
					getter_function: StorageService.get_beta_feature_flag,
					setter_function: StorageService.save_beta_feature_flag
				}
			]
		}
	}


	/**
	 * Interface that represents a checkbox option in the settings
	 */
	interface GenericCheckboxComponent
	{
		label_text_key: i18nOptionsKeys,
		getter_function: () => Promise<boolean>,
		setter_function: (value: boolean) => void
	}
</script>
