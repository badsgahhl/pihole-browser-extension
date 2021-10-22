import Vue from 'vue'
import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.min.css'
import { UserVuetifyPreset } from 'vuetify/types/services/presets'

Vue.use(Vuetify)

const mq = window.matchMedia('(prefers-color-scheme: dark)')
const opts: Partial<UserVuetifyPreset> = {
  icons: {
    iconfont: 'mdiSvg'
  },
  theme: { dark: mq.matches }
}

const vuetify = new Vuetify(opts)

mq.addEventListener('change', e => {
  vuetify.framework.theme.dark = e.matches
})
export default vuetify
