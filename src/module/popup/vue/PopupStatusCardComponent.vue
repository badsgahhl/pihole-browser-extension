<template>
    <b-card no-body>
        <b-card-header class="status">
            {{ translate(i18nPopupKeys.popup_status_card_title)}}
        </b-card-header>
        <b-card-body>
            <div class="text">
                {{translate(i18nPopupKeys.popup_status_card_info_text)}}
            </div>
            <b-input-group class="justify-content-center">
                <b-form-input v-model.number:value="default_disable_time" id="time" type="number" min="0"
                              :disabled="default_disable_time_disabled"/>
                <b-input-group-append>
                    <b-input-group-text class="time_unit">{{time_unit}}</b-input-group-text>
                </b-input-group-append>
            </b-input-group>
        </b-card-body>
        <b-card-footer class="text-center" style="max-height: 45px;">
            <label id="switch">
                <input :disabled="slider_disabled" v-model:checked="slider_checked" v-on:change="sliderClicked()"
                       id="sliderBox" type="checkbox"/>
                <span class="slider justify-content-center"></span>
            </label>
        </b-card-footer>
    </b-card>
</template>

<script lang="ts">
	import Vue from 'vue';
	import {Component, Prop} from 'vue-property-decorator';
	import {i18nPopupKeys, i18nService} from "../../../service/browser/i18nService";
	import {PiHoleSettingsDefaults, StorageService} from "../../../service/browser/StorageService";
	import {BadgeService, ExtensionBadgeText} from "../../../service/browser/BadgeService";
	import {PiHoleApiService} from "../../../service/api/service/PiHoleApiService";
	import {PiHoleApiStatus, PiHoleApiStatusEnum} from "../../../service/api/models/pihole/PiHoleApiStatus";
	import {TabService} from "../../../service/browser/TabService";

	@Component
	export default class PopupComponent extends Vue
	{
		@Prop({default: () => i18nPopupKeys})
		i18nPopupKeys!: typeof i18nPopupKeys;

		// Prop which is emitted to the parent. Gets updates after a pihole status check
		@Prop({default: false})
		is_active_by_status!: boolean;

		// Is the pihole active by badge text.
		@Prop({required: true})
		is_active_by_badge!: boolean;

		// Data Prop if the slider is checked
		private slider_checked: boolean = this.is_active_by_badge;

		// Data Prop if slider is disabled
		private slider_disabled: boolean = !this.is_active_by_badge;

		// Data Prop if disable time input is disabled
		private default_disable_time_disabled: boolean = !this.is_active_by_badge;

		// Data Prop of disable time
		private default_disable_time: number = PiHoleSettingsDefaults.default_disable_time;

		mounted()
		{
			this.update_default_disable_time();
			this.update_status();
		}

		private get time_unit(): string
		{
			return Number(this.default_disable_time) === 0 ? '∞' : 's';
		}

		/**
		 * Updates the disable time with the time in the storage
		 */
		private async update_default_disable_time(): Promise<void>
		{
			this.default_disable_time = await StorageService.get_default_disable_time();
		}

		/**
		 * Updates the current status of the pihole
		 */
		private async update_status(): Promise<void>
		{
			const pi_hole_enabled_from_badge = (await BadgeService.get_badge_text() === ExtensionBadgeText.enabled);

			if (pi_hole_enabled_from_badge)
			{
				this.slider_checked = true;
				this.slider_disabled = false;
				this.default_disable_time_disabled = false;
			}

			PiHoleApiService.refresh_pi_hole_status(((data: PiHoleApiStatus) => this.update_components_by_data(data))).then();
		}

		/**
		 * Updates the components depending on PiHoleApiStatus
		 * @param data
		 */
		private update_components_by_data(data: PiHoleApiStatus): void
		{
			if (data.status === PiHoleApiStatusEnum.disabled)
			{
					this.default_disable_time_disabled = true;
					this.slider_checked = false;
					this.slider_disabled = false;
					BadgeService.set_badge_text(ExtensionBadgeText.disabled);
					this.$emit('update:is_active_by_status', false);
				}
			else if (data.status === PiHoleApiStatusEnum.enabled)
			{
				this.default_disable_time_disabled = false;
				this.slider_disabled = false;
				this.slider_checked = true;
				BadgeService.set_badge_text(ExtensionBadgeText.enabled);
				this.$emit('update:is_active_by_status', true)

			}
			else
			{
				this.default_disable_time_disabled = true;
				this.slider_disabled = true;
				this.slider_checked = false;
				BadgeService.set_badge_text(ExtensionBadgeText.error);
				this.$emit('update:is_active_by_status', false)
			}
		}

		/**
		 * Slider OnClick Function
		 * Enables/Disables all PiHoles
		 */
		private sliderClicked(): void
		{
			console.log(this.slider_checked);

			const status_mode = this.slider_checked ? PiHoleApiStatusEnum.enabled : PiHoleApiStatusEnum.disabled;
			let time: number = this.default_disable_time;

			if (time >= 0)
			{
				const success_callback = (data: PiHoleApiStatus) => this.on_slider_click_success_handler(data);
				const error_callback = (data: string) => this.throw_console_badge_error(data);
				PiHoleApiService.change_pi_hole_status(status_mode, time, success_callback, error_callback);
			}
			else
			{
				this.throw_console_badge_error('Time cannot be smaller than 0. Canceling api request.', true);
			}

		}

		/**
		 * Success Callback after the slider was clicked and the request was success full
		 * @param data
		 */
		private on_slider_click_success_handler(data: PiHoleApiStatus): void
		{
			this.update_components_by_data(data);
			if (data.status === PiHoleApiStatusEnum.disabled)
			{
				const reload_after_disable_callback = (is_enabled: boolean) => {
					if (is_enabled)
					{
						TabService.reload_current_tab(1000);
					}
				}
				StorageService.get_reload_after_disable().then(reload_after_disable_callback);
			}
		}

		/**
		 * Function to throw a error to the console and changing the badge
		 * @param error_message
		 * @param refresh_status
		 */
		private throw_console_badge_error(error_message: string, refresh_status: boolean = false): void
		{
			console.warn(error_message);

			this.update_components_by_data({status: PiHoleApiStatusEnum.error})
			if (refresh_status)
			{
				setTimeout(() => {
					PiHoleApiService.refresh_pi_hole_status((data => this.update_components_by_data(data))).then();
				}, 1500);
			}
		}

		/**
		 * Wrapper for translation
		 * @param string
		 */
		translate(string: i18nPopupKeys): string
		{
			return i18nService.translate(string);
		}
	}
</script>

<style lang="sass" scoped>


.text
    font-size: 13px
    margin-bottom: 10px
    text-align: center

/* The switch - the box around the slider */
#switch
    /* margin-top: 5px; */
    position: relative
    display: inline-block
    width: 60px
    height: 34px

    input
        display: none

.slider
    position: absolute
    cursor: pointer
    top: 0
    left: 0
    right: 0
    bottom: 0
    background-color: #ccc
    -webkit-transition: .4s
    transition: .4s
    border-radius: 15px

.slider:before
    position: absolute
    content: ""
    border-radius: 15px
    height: 26px
    width: 26px
    left: 4px
    bottom: 4px
    background-color: white
    -webkit-transition: .4s
    transition: .4s

input
    + .slider
        background-color: red

input:checked
    + .slider
        background-color: #22B225

input:focus
    + .slider
        box-shadow: 0 0 1px #22B225


input:checked
    + .slider:before
        -webkit-transform: translateX(26px)
        -ms-transform: translateX(26px)
        transform: translateX(26px)

.time_unit
    min-width: 40px

#time
    max-width: 80px
    border-top-left-radius: 5px !important
    border-bottom-left-radius: 5px !important

#time:focus
    border-color: #ced4da
    box-shadow: unset
    outline: none


</style>
