import Vue from 'vue';
import {BIconCheckCircle, BIconXCircle, BootstrapVue} from 'bootstrap-vue';
import {Initializer} from '../../general/Initializer';
import PopupComponent from '../vue/PopupComponent.vue';

export default class PopupInitializer implements Initializer {
  init(): void {
    const vueComponent = {
      el: '#main',
      render: (h: any) => h(PopupComponent),
    };

    Vue.use(BootstrapVue);
    Vue.component('BIconCheckCircle', BIconCheckCircle);
    Vue.component('BIconXCircle', BIconXCircle);
    // eslint-disable-next-line no-new
    new Vue(vueComponent);
  }
}
