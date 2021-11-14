import Vue from 'vue'
import VueCompositionAPI from '@vue/composition-api'
import { Initializer } from '../../general/Initializer'
import PopupComponent from '../vue/view/PopupComponent.vue'
import vuetify from '../../../plugins/vuetify'

export default class PopupInitializer implements Initializer {
  init(): void {
    const vueComponent = {
      vuetify,
      el: '#main',
      render: (h: any) => h(PopupComponent)
    }
    Vue.use(VueCompositionAPI)

    // eslint-disable-next-line no-new
    new Vue(vueComponent)
  }
}
