import Vue from 'vue'
import vueDebounce from 'vue-debounce'
import {
  BIconClipboard,
  BIconEye,
  BIconEyeSlash,
  BIconPlusCircle,
  BIconXCircle,
  BootstrapVue
} from 'bootstrap-vue'
import VueCompositionAPI from '@vue/composition-api'
import { Initializer } from '../../general/Initializer'
import OptionComponent from '../vue/OptionComponent.vue'
import vuetify from '../../../plugins/vuetify'

export default class OptionsInitializer implements Initializer {
  public init(): void {
    const vueComponent = {
      vuetify,
      el: '#main',
      render: (h: any) => h(OptionComponent)
    }

    Vue.use(vueDebounce)
    Vue.use(BootstrapVue)
    Vue.use(VueCompositionAPI)
    Vue.component('BIconPlusCircle', BIconPlusCircle)
    Vue.component('BIconXCircle', BIconXCircle)
    Vue.component('BIconClipboard', BIconClipboard)
    Vue.component('BIconEye', BIconEye)
    Vue.component('BIconEyeSlash', BIconEyeSlash)
    // eslint-disable-next-line no-new
    new Vue(vueComponent)
  }
}
