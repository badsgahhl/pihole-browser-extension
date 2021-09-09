import Vue from 'vue'
import {
  BIconClipboard,
  BIconEye,
  BIconEyeSlash,
  BIconPlusCircle,
  BIconXCircle,
  BootstrapVue
} from 'bootstrap-vue'
import { Initializer } from '../../general/Initializer'
import OptionComponent from '../vue/OptionComponent.vue'

export default class OptionsInitializer implements Initializer {
  public init(): void {
    const vueComponent = {
      el: '#main',
      render: (h: any) => h(OptionComponent)
    }

    Vue.use(BootstrapVue)
    Vue.component('BIconPlusCircle', BIconPlusCircle)
    Vue.component('BIconXCircle', BIconXCircle)
    Vue.component('BIconClipboard', BIconClipboard)
    Vue.component('BIconEye', BIconEye)
    Vue.component('BIconEyeSlash', BIconEyeSlash)
    // eslint-disable-next-line no-new
    new Vue(vueComponent)
  }
}
