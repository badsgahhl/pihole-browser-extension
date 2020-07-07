<template>
    <h6>{{rows}}</h6>
</template>

<script>

	import {StorageService} from "../../../service/browser/StorageService";

	export default {
		name: 'PopupSliderComponent',
		data() {
			return {
				loading: false,
				rows: []
			}
		},
		mounted() {
			this.getDataFromApi()
		},
		methods: {
			getDataFromApi() {
				this.loading = true
				StorageService.get_pi_hole_settings_array()
					.then(response => {
						console.log(response)
						this.loading = false
						this.rows = response
					})
					.catch(error => {
						this.loading = false
						console.log(error)
					})
			}
		}
	}
</script>

<style scoped>
    p {
        font-size: 20px;
    }
</style>
