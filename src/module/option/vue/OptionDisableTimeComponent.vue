<template>
    <b-form-group :label="translate(i18nOptionsKeys.options_default_time_label)">
        <b-input-group>
            <b-input min="10" type="number" v-model:value="disable_time"></b-input>
            <b-input-group-append>
                <b-input-group-text>{{translate(i18nOptionsKeys.options_default_time_unit)}}</b-input-group-text>
            </b-input-group-append>
        </b-input-group>
    </b-form-group>
</template>

<script lang="ts">

	import {Component, Prop, Watch} from "vue-property-decorator";
	import Vue from "vue";
	import {i18nOptionsKeys, i18nService} from "../../../service/browser/i18nService";
	import {PiHoleSettingsDefaults, StorageService} from "../../../service/browser/StorageService";

	@Component
	/**
	 * Component for the setting 'default_disable_time'
	 **/
	export default class OptionDisableTimeComponent extends Vue
	{
		@Watch('disable_time')
		private on_disable_time_changes(): void
		{
			if (this.disable_time >= 10)
			{
				StorageService.save_default_disable_time(this.disable_time);
			}
		}

		// Data Prop fpr the disable time
		private disable_time: number = PiHoleSettingsDefaults.default_disable_time;

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
			this.update_disable_time();
		}

		/**
		 * Function to update the disable time
		 */
		private update_disable_time(): void
		{
			StorageService.get_default_disable_time().then(time => {
				if (typeof time !== "undefined")
				{
					this.disable_time = time;
				}
			})
		}

	}
</script>

