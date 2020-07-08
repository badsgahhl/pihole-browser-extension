<template>
    <b-card no-body>
        <b-card-header class="status" id="list_card">
            {{ translate(i18nPopupKeys.popup_second_card_current_url)}}
        </b-card-header>
        <b-card-body id="current_url" class="text-center" :class="background_classes">{{current_url}}
        </b-card-body>
        <b-card-footer class="text-center">
            <b-button variant="success" size="sm" :disabled="buttons_disabled"
                      :title="translate(i18nPopupKeys.popup_second_card_whitelist)"
                      v-on:click="whitelist_url" id="list_action_white">
                <b-icon-check-circle v-if="!whitelisting_active" style="height: 20px;width: 20px"></b-icon-check-circle>
                <b-spinner v-else style="width:18px;height: 18px"></b-spinner>
            </b-button>
            <b-button variant="danger" size="sm" :disabled="buttons_disabled"
                      :title="translate(i18nPopupKeys.popup_second_card_blacklist)"
                      v-on:click="blacklist_url"
                      id="list_action_black">
                <b-icon-x-circle v-if="!blacklisting_active" style="height: 20px;width: 20px"></b-icon-x-circle>
                <b-spinner v-else style="width:18px;height: 18px"></b-spinner>
            </b-button>
        </b-card-footer>
    </b-card>
</template>

<script lang="ts">
	import Vue from 'vue';
	import {Component, Prop} from "vue-property-decorator";
	import {i18nPopupKeys, i18nService} from "../../../service/browser/i18nService";
	import {ApiListMode} from "../../../service/api/models/pihole/PiHoleListStatus";
	import {StorageService} from "../../../service/browser/StorageService";
	import {PiHoleApiService} from "../../../service/api/service/PiHoleApiService";
	import {TabService} from "../../../service/browser/TabService";
	import WebRequestHeadersDetails = chrome.webRequest.WebRequestHeadersDetails;
	import BlockingResponse = chrome.webRequest.BlockingResponse;

	@Component
	export default class PopupListCardComponent extends Vue
	{
		@Prop({default: () => i18nPopupKeys})
		i18nPopupKeys!: typeof i18nPopupKeys;

		// Current URL passed by the parent
		@Prop({required: true})
		current_url!: string;

		// Data prop: Are the buttons disabled?
		private buttons_disabled: boolean = false;

		// Data prop: Is the whitelisting routine running?
		private whitelisting_active: boolean = false;

		// Data prop: Is the blacklisting routine running;
		private blacklisting_active: boolean = false;

		// Data prop: Which background classes are currently used to show a status.
		private background_classes: string = '';


		/**
		 * Wrapper for translation
		 * @param string
		 */
		translate(string: i18nPopupKeys): string
		{
			return i18nService.translate(string);
		}

		/**
		 * Wrapper function for the onclick button event
		 */
		private whitelist_url(): void
		{
			this.list_domain(ApiListMode.whitelist);
		}

		/**
		 * Wrapper function for the onclick button event
		 */
		private blacklist_url(): void
		{
			this.list_domain(ApiListMode.blacklist);
		}

		/**
		 * This function will add a domain to the whitelist or block list
		 * @param mode
		 */
		private async list_domain(mode: ApiListMode): Promise<void>
		{
			let pi_hole_urls = (await StorageService.get_pi_hole_settings_array());
			let pi_hole_urls_array = [];
			if (typeof pi_hole_urls !== "undefined")
			{
				for (const pi_hole_url of pi_hole_urls)
				{
					pi_hole_urls_array.push(pi_hole_url.pi_uri_base + "/*");
				}
			}
			else
			{
				return;
			}

			const domain = this.current_url;

			if (!pi_hole_urls_array || !domain)
			{
				return;
			}

			// Registering the handler only after the button click. We dont want to change the headers of anything else
			// This is only needed in chrome! -.-
			if (typeof browser === 'undefined')
			{
				chrome.webRequest.onBeforeSendHeaders.addListener(
					this.get_web_request_origin_modifier_callback, {
						urls: pi_hole_urls_array
					},
					[
						"blocking",
						"requestHeaders",
						"extraHeaders"
					]);
			}

			this.buttons_disabled = true;

			if (mode === ApiListMode.whitelist)
			{
				this.whitelisting_active = true
			}
			else
			{
				this.blacklisting_active = true;
			}

			// Delay between each call to one of multiple piholes
			const delay_increment = 2000;
			let delay = 0;

			const pi_hole_list_results = (await PiHoleApiService.list_domain(domain, mode));

			if (typeof browser === 'undefined')
			{
				chrome.webRequest.onBeforeSendHeaders.removeListener(this.get_web_request_origin_modifier_callback);
			}

			pi_hole_list_results.forEach((pi_hole_result, index) => {
				setTimeout(() => {
					if (pi_hole_result.includes('skipped'))
					{
						this.background_classes = 'bg-warning';
						setTimeout(() => {
							this.background_classes = '';
						}, 1500)
					}
					else if (pi_hole_result.includes('added'))
					{
						this.background_classes = 'bg-success';
						setTimeout(() => {
							this.background_classes = '';
						}, 1500);
					}

					// After the last one we enable the button again and remove the spinning circle
					if (index + 1 === pi_hole_list_results.length)
					{
						setTimeout(async () => {
							const reload_after_white_black_list = (await StorageService.get_reload_after_white_list());

							if (reload_after_white_black_list && mode === ApiListMode.whitelist)
							{
								TabService.reload_current_tab(250);
							}

							this.buttons_disabled = false;
							this.whitelisting_active = false;
							this.blacklisting_active = false;

						}, 1500);
					}
				}, delay);
				delay += delay_increment;
			})
		}

		/**
		 * Function to override the webrequest header.
		 * This is needed to go around the pihole cors security policies.
		 * @param details
		 */
		private get_web_request_origin_modifier_callback(details: WebRequestHeadersDetails): BlockingResponse
		{
			for (let i = 0; !(details.requestHeaders) || i < details.requestHeaders.length; ++i)
			{
				if (!(details.requestHeaders) || details.requestHeaders[i].name === 'Origin')
				{
					if (details.requestHeaders)
					{
						details.requestHeaders[i].value = '';
					}
				}
			}

			return {
				requestHeaders: details.requestHeaders
			}
		}
	}
</script>
