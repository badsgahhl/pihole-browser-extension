import Vue from 'vue'
import vueDebounce from 'vue-debounce'
import VueCompositionAPI from '@vue/composition-api'
import VueRouter from 'vue-router'
import { Initializer } from '../../general/Initializer'
import vuetify from '../../../plugins/vuetify'
import { I18NOptionKeys, I18NService } from '../../../service/i18NService'
import OptionLayout from '../vue/layout/OptionLayout.vue'

export default class OptionsInitializer implements Initializer {
  public init(): void {
    const router = new VueRouter({
      routes: [
        {
          path: '/',
          component: () => import('../vue/views/OptionSettingsView.vue'),
          meta: {
            title: I18NService.translate(I18NOptionKeys.options_settings)
          }
        },
        {
          path: '/about',
          component: () => import('../vue/views/OptionAboutView.vue'),
          meta: {
            title: I18NService.translate(I18NOptionKeys.options_about)
          }
        }
      ]
    })

    router.afterEach(to => {
      Vue.nextTick(() => {
        document.title = I18NService.translate(I18NOptionKeys.options_title, [
          to.meta!.title || ''
        ])
      })
    })

    const vueComponent = {
      router,
      vuetify,
      el: '#main',
      render: (h: any) => h(OptionLayout)
    }

    Vue.use(VueRouter)
    Vue.use(vueDebounce)
    Vue.use(VueCompositionAPI)
    // eslint-disable-next-line no-new
    new Vue(vueComponent)
  }
}
