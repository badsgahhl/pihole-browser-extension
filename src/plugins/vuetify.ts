import '@mdi/font/css/materialdesignicons.css'
import Vue from 'vue'
import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.min.css'
import { UserVuetifyPreset } from 'vuetify/types/services/presets'

Vue.use(Vuetify)

const opts: Partial<UserVuetifyPreset> = {
  icons: {
    iconfont: 'mdi' // default - only for display purposes
  }
}

export default new Vuetify(opts)
