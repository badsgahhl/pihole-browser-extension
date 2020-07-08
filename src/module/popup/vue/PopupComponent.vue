<template>
    <div id="popup">
        <PopupStatusCardComponent :is_active_by_status.sync="is_active_by_real_status"
                                  v-if="is_active_by_badge_loaded" :is_active_by_badge="is_active_by_badge"/>
        <PopupListCardComponent v-if="is_active_by_real_status && current_url.length > 0" :current_url="current_url"/>
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
	export default class PopupComponent extends Vue
	{
		private is_active_by_badge: boolean = false;

		private is_active_by_badge_loaded: boolean = false

		private is_active_by_real_status: boolean = false;

		private current_url: string = '';

		mounted()
		{
			this.update_is_active_by_badge();
			this.update_current_url();
		}

		private update_is_active_by_badge(): void
		{
			BadgeService.get_badge_text().then((text: string) => {
				this.is_active_by_badge = text === ExtensionBadgeText.enabled;
				this.is_active_by_badge_loaded = true;
			})
		}

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

<style lang="sass" scoped>
#popup
    margin: 1px 1px 1px 1px
    text-align: center

</style>
