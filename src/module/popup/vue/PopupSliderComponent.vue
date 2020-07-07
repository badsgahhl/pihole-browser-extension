<template>
    <label id="switch">
        <input :checked="is_checked" v-on:change="sliderClicked()" id="sliderBox" type="checkbox"/>
        <span class="slider justify-content-center"></span>
    </label>
</template>

<script lang="ts">
	import Vue from 'vue'
	import {Component, Prop} from 'vue-property-decorator'

	@Component
	export default class PopupSliderComponent extends Vue
	{
		// Data property
		@Prop({default: false})
		is_checked: boolean;

		// Lifecycle hook
		mounted()
		{
			console.log(this.is_checked)
		}

		// Component method
		sliderClicked()
		{
			console.log(this.is_checked);
		}
	}
</script>

<style scoped>
    /* The switch - the box around the slider */
    #switch {
        /* margin-top: 5px; */
        position: relative;
        display: inline-block;
        width: 60px;
        height: 34px;
    }

    /* Hide default HTML checkbox */
    #switch input {
        display: none;
    }

    /* The slider */
    .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        -webkit-transition: .4s;
        transition: .4s;
        border-radius: 15px;
    }

    .slider:before {
        position: absolute;
        content: "";
        border-radius: 15px;
        height: 26px;
        width: 26px;
        left: 4px;
        bottom: 4px;
        background-color: white;
        -webkit-transition: .4s;
        transition: .4s;
    }

    input + .slider {
        background-color: red;
    }

    input:checked + .slider {
        background-color: #22B225;
    }

    input:focus + .slider {
        box-shadow: 0 0 1px #22B225;
    }

    input:checked + .slider:before {
        -webkit-transform: translateX(26px);
        -ms-transform: translateX(26px);
        transform: translateX(26px);
    }
</style>
