import {Initializer} from "../../general/Initializer";
import OptionComponent from "../vue/OptionComponent.vue";
import Vue from "vue";
import {BIconClipboard, BIconEye, BIconEyeSlash, BIconPlusCircle, BIconXCircle, BootstrapVue} from "bootstrap-vue";

export default class OptionsInitializer implements Initializer {
    init(): void {
        const option_vue_component = {
            el: "#main",
            render: (h: any) => h(OptionComponent)
        };

        Vue.use(BootstrapVue);
        Vue.component('BIconPlusCircle', BIconPlusCircle);
        Vue.component('BIconXCircle', BIconXCircle);
        Vue.component('BIconClipboard', BIconClipboard);
        Vue.component('BIconEye', BIconEye);
        Vue.component('BIconEyeSlash', BIconEyeSlash);
        new Vue(option_vue_component);
    }
}