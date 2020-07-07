<template>
    <div id="popup">
        <b-card no-body>
            <b-card-header class="status">
                {{ translate(i18nPopupKeys.popup_status_card_title)}}
            </b-card-header>
            <b-card-body>
                <div class="text">{{translate(i18nPopupKeys.popup_status_card_info_text)}}</div>
                <PopupDisableTimeComponent></PopupDisableTimeComponent>
            </b-card-body>
            <b-card-footer style="max-height: 45px;">
                <PopupSliderComponent :is_checked=true></PopupSliderComponent>
            </b-card-footer>
        </b-card>
    </div>
</template>

<script lang="ts">

	import {i18nPopupKeys, i18nService} from "../../../service/browser/i18nService";

	import Vue from 'vue'
	import {Component, Prop} from 'vue-property-decorator'
	import PopupDisableTimeComponent from "./PopupDisableTimeComponent.vue";
	import PopupSliderComponent from "./PopupSliderComponent.vue";

	@Component({
					  components: {PopupSliderComponent, PopupDisableTimeComponent}
				  })
	export default class PopupComponent extends Vue
	{
		// Data property
		@Prop({default: () => i18nPopupKeys})
		i18nPopupKeys: string;


		// Lifecycle hook
		mounted()
		{

		}

		translate(string)
		{
			return i18nService.translate(string);
		}
	}
</script>

<style scoped>
    #popup {
        margin: 1px 1px 1px 1px;
        text-align: center;
    }

    .status {
        font-size: 16px;
        text-align: center;
        font-weight: bold;
    }

    .text {
        font-size: 13px;
        margin-bottom: 10px;
        text-align: center;
    }
</style>
