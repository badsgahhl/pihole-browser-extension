<template>
    <b-alert v-if="updates_available" class="popup-update-alert" variant="danger" show>
        {{translate(i18nPopupKeys.popup_update_card_info,[updates_available_amount,amount_of_piholes])}}
    </b-alert>
</template>

<script lang="ts">

	import Vue from 'vue';
	import {Component, Prop} from "vue-property-decorator";
	import {PiHoleApiService} from "../../../service/api/service/PiHoleApiService";
	import {PiHoleVersions} from "../../../service/api/models/pihole/PiHoleVersions";
	import {i18nPopupKeys, i18nService} from "../../../service/browser/i18nService";

	@Component
	export default class PopupUpdateAlertComponent extends Vue
	{
		@Prop({default: () => i18nPopupKeys})
		i18nPopupKeys!: typeof i18nPopupKeys;

		private updates_available: boolean = false;
		private updates_available_amount: number = 0;
		private amount_of_piholes: number = 0;

		mounted()
		{
			this.check_for_updates();
		}

		/**
		 * Wrapper for translation
		 * @param string
		 */
		translate(string: i18nPopupKeys, placeholder?: any): string
		{
			return i18nService.translate(string, placeholder);
		}

		private check_for_updates(): void
		{
			const get_pi_hole_version_callback = ((pi_hole_versions_array: PiHoleVersions[]) => {
				let update_available = false;
				let amount_updatable = 0;
				for (const pi_hole_version of pi_hole_versions_array)
				{
					if (pi_hole_version.FTL_current < pi_hole_version.FTL_latest || pi_hole_version.core_current < pi_hole_version.core_latest || pi_hole_version.web_current < pi_hole_version.web_latest)
					{
						update_available = true;
						amount_updatable++;
					}
				}
				if (update_available)
				{
					this.updates_available = update_available;
					this.updates_available_amount = amount_updatable;
					this.amount_of_piholes = pi_hole_versions_array.length;
				}
			})
			PiHoleApiService.get_pi_hole_version().then(get_pi_hole_version_callback);

		}
	}
</script>

<style lang="sass" scoped>
.popup-update-alert
    padding: 0 !important
    font-size: 14px
    margin-top: 5px
    font-weight: bold
    margin-bottom: 0 !important
</style>
