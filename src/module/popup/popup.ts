import "../general/general.scss";
import {BIconCheckCircle, BIconXCircle, BootstrapVue} from 'bootstrap-vue';
import Vue from "vue";
import PopupComponent from "./vue/PopupComponent.vue";

/**
 * Main Init function for the popup
 */
function init(): void {
    const popup_vue_component = {
        el: "#main",
        render: (h: any) => h(PopupComponent)
    };

    Vue.use(BootstrapVue);
    Vue.component('BIconCheckCircle', BIconCheckCircle);
    Vue.component('BIconXCircle', BIconXCircle);
    new Vue(popup_vue_component);
}

/**
 * EventListener Section
 */
document.addEventListener('DOMContentLoaded', () => init()); //When the page loads get the status
