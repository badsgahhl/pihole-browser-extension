<template>
    <div id="popup">
        <PopupStatusCardComponent :is_active_by_status.sync="is_active_by_real_status"
                                  v-if="is_active_by_badge_loaded" :is_active_by_badge="is_active_by_badge"/>
        <PopupListCardComponent
                v-if="is_pi_hole_version_5_or_higher && is_active_by_real_status && current_url.length > 0"
                :current_url="current_url" :is_pi_hole_version_5_or_higher.sync="is_pi_hole_version_5_or_higher"/>
        <PopupUpdateAlertComponent v-if="is_active_by_real_status"/>
    </div>
</template>

<script lang="ts">

	import Vue from 'vue';
	import {Component} from 'vue-property-decorator';
	import PopupStatusCardComponent from "./PopupStatusCardComponent.vue";
	import PopupListCardComponent from "./PopupListCardComponent.vue";
	import {BadgeService, ExtensionBadgeText} from "../../../service/browser/BadgeService";
	import {TabService} from "../../../service/browser/TabService";
	import PopupUpdateAlertComponent from "./PopupUpdateAlertComponent.vue";

	@Component({
					  components: {PopupUpdateAlertComponent, PopupListCardComponent, PopupStatusCardComponent}
				  })
	/**
	 * The Main PopupComponent.
	 */
	export default class PopupComponent extends Vue
	{
		// Data Prop: is the pi-hole active by using the status of the badge
		private is_active_by_badge: boolean = false;

		// Data Prop: Is the the badge status loaded. true will start rendering the cards
		private is_active_by_badge_loaded: boolean = false

		// Data Prop: How is the real status of the pi hole
		private is_active_by_real_status: boolean = false;

		// Data Prop: Has every pihole version 5 or higher?
		private is_pi_hole_version_5_or_higher: boolean = true;

		// Data Prop of the current url
		private current_url: string = '';

		mounted()
		{
			this.update_is_active_by_badge();
			this.update_current_url();
		}

		/**
		 * Gets the prop by the badge status
		 */
		private update_is_active_by_badge(): void
		{
			BadgeService.get_badge_text().then((text: string) => {
				this.is_active_by_badge = text === ExtensionBadgeText.enabled;
				this.is_active_by_badge_loaded = true;
			})
		}

		/**
		 * Gets the current url and saves it to the prop
		 */
		private update_current_url(): void
		{
			TabService.get_current_tab_url_cleaned().then((url: string) => {
				if (url.length > 0)
				{
					this.current_url = url;
				}
			})
		}
	}


</script>

<style lang="scss">

$card-padding: 5px;

#popup {
    margin: 1px 1px 1px 1px;
    text-align: center;
}

body {
    width: 150px;
    overflow: hidden;
}

.card-body {
    padding: $card-padding !important;
    font-size: 14px;
}

.card:nth-child(n+2) {
    margin-top: 5px;
}

.card-header {
    padding: $card-padding !important;
    font-size: 16px;
}

.card-footer {
    padding: $card-padding !important;
}

.status {
    font-size: 16px;
    text-align: center;
    font-weight: bold;
}
</style>
