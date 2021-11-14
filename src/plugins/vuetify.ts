import Vue from 'vue'
import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.min.css'
import { UserVuetifyPreset } from 'vuetify/types/services/presets'

Vue.use(Vuetify)

const opts: Partial<UserVuetifyPreset> = {
  icons: {
    iconfont: 'mdiSvg'
  },
  theme: { dark: true }
}

const vuetify = new Vuetify(opts)

export default vuetify
