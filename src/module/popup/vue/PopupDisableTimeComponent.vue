<template>
    <b-input-group class="justify-content-center">
        <b-form-input v-model.number:value="default_disable_time" id="time" type="number" min="0"/>
        <b-input-group-append>
            <b-input-group-text class="time_unit">{{time_unit}}</b-input-group-text>
        </b-input-group-append>
    </b-input-group>
</template>

<script lang="ts">
	import Vue from 'vue'
	import {Component} from 'vue-property-decorator'
	import {StorageService} from "../../../service/browser/StorageService";

	@Component
	export default class PopupDisableTimeComponent extends Vue
	{
		private default_disable_time: number = 10;

		mounted()
		{
			this.update_default_disable_time();
		}

		get time_unit()
		{
			return Number(this.default_disable_time) === 0 ? '∞' : 's';
		}

		private async update_default_disable_time()
		{
			this.default_disable_time = await StorageService.get_default_disable_time();
		}

	}
</script>

<style scoped>
    .time_unit {
        min-width: 40px;
    }
</style>
