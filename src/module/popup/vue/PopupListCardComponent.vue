<template>
    <b-card no-body>
        <b-card-header class="status" id="list_card">
            {{ translate(i18nPopupKeys.popup_second_card_current_url)}}
        </b-card-header>
        <b-card-body id="current_url" class="text-center">{{current_url}}</b-card-body>
        <b-card-footer class="text-center">
            <button title="Whitelist" class="btn btn-success btn-sm btn-list" id="list_action_white">
                <b-icon-check-circle scale="1.2"></b-icon-check-circle>
                <span style="width: 18px; height: 18px;" class="spinner-border spinner-border-sm d-none" role="status"
                      aria-hidden="true"></span></button>
            <button title="Blacklist" class="btn btn-danger btn-sm btn-list" id="list_action_black">
                <b-icon-x-circle scale="1.2"></b-icon-x-circle>
                <span style="width: 18px; height: 18px;" class="spinner-border spinner-border-sm d-none" role="status"
                      aria-hidden="true"></span></button>
        </b-card-footer>
    </b-card>
</template>

<script lang="ts">
	import Vue from 'vue';
	import {Component, Prop} from "vue-property-decorator";
	import {i18nPopupKeys, i18nService} from "../../../service/browser/i18nService";

	@Component
	export default class PopupListCardComponent extends Vue
	{
		@Prop({default: () => i18nPopupKeys})
		i18nPopupKeys!: typeof i18nPopupKeys;

		@Prop({required: true})
		current_url!: string;


		mounted()
		{
			this.update_current_url();
		}


		private update_current_url(): void
		{
			;
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

</style>
