import {Initializer} from "../../general/Initializer";
import PopupComponent from "../vue/PopupComponent.vue";
import Vue from "vue";
import {BIconCheckCircle, BIconXCircle, BootstrapVue} from "bootstrap-vue";

export default class PopupInitializer implements Initializer {

    init(): void {
        const popup_vue_component = {
            el: "#main",
            render: (h: any) => h(PopupComponent)
        };

        Vue.use(BootstrapVue);
        Vue.component('BIconCheckCircle', BIconCheckCircle);
        Vue.component('BIconXCircle', BIconXCircle);
        new Vue(popup_vue_component);
    }
}