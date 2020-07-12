<template>
    <div id="option">
        <h6 class="headline text-center">{{translate(i18nOptionsKeys.options_headline_info)}}</h6>
        <OptionTabComponent></OptionTabComponent>

        <OptionDisableTimeComponent></OptionDisableTimeComponent>

        <OptionGenericCheckboxComponent v-for="item in checkbox_options" v-bind:key="item.key"
                                        :label_text_key="item.label_text_key"
                                        :setter_function="item.setter_function"
                                        :getter_function="item.getter_function"/>
    </div>
</template>

<script lang="ts">
	import Vue from 'vue';
	import {Component, Prop} from 'vue-property-decorator';
	import OptionGenericCheckboxComponent from "./OptionGenericCheckboxComponent.vue";
	import {StorageService} from "../../../service/browser/StorageService";
	import {i18nOptionsKeys, i18nService} from "../../../service/browser/i18nService";
	import OptionTabComponent from "./OptionTabComponent.vue";
	import OptionDisableTimeComponent from "./OptionDisableTimeComponent.vue";

	@Component({
					  components: {OptionDisableTimeComponent, OptionTabComponent, OptionGenericCheckboxComponent}
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
		translate(string: i18nOptionsKeys, placeholder?: any): string
		{
			return i18nService.translate(string, placeholder);
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

<style lang="sass" scoped>
#option
    padding: 10px
    min-width: 550px
    max-width: 600px

.headline
    margin-bottom: 10px

    @-moz-document url-prefix()
        font-size: 16px

</style>
