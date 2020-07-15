<template>
    <b-card class="shadow" no-body>
        <b-card-header class="h6">🖥️ {{translate(i18nOptionsKeys.option_extension)}}</b-card-header>
        <b-card-body>
            <p>{{translate('manifest_description')}}</p>
            <hr class="mt-0">
            <p>{{translate(i18nOptionsKeys.option_contributors)}}
                <br>
                <b-link class="dark-mode-light-link" target="_blank" href="https://github.com/badsgahhl">Pascal Glaser
                </b-link>
                ,
                <b-link class="dark-mode-light-link" target="_blank" href="https://github.com/erikr729">Erik Rill
                </b-link>
            </p>
        </b-card-body>
    </b-card>
</template>

<script lang="ts">
	import Vue from "vue";
	import {Component, Prop} from "vue-property-decorator";
	import {i18nOptionsKeys, i18nService} from "../../../../service/browser/i18nService";

	@Component
	export default class OptionAboutExtension extends Vue
	{
		@Prop({default: () => i18nOptionsKeys})
		i18nOptionsKeys!: typeof i18nOptionsKeys;

		/**
		 * Wrapper for translation
		 * @param string
		 */
		translate(string: string): string
		{
			return i18nService.translate(string);
		}
	}
</script>
