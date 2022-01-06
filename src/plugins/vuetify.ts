import Vue from 'vue'
import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.min.css'
import { UserVuetifyPreset } from 'vuetify/types/services/presets'

Vue.use(Vuetify)

let darkTheme = false

if (
  window.matchMedia &&
  window.matchMedia('(prefers-color-scheme: dark)').matches
) {
  darkTheme = true
}

const opts: Partial<UserVuetifyPreset> = {
  icons: {
    iconfont: 'mdiSvg'
  },
  theme: {
    dark: darkTheme,
    themes: {
      dark: {
        primary: '#ff5023',
        secondary: '#91dc5a',
        accent: '#3f51b5',
        error: '#e91e63',
        warning: '#ffeb3b',
        info: '#607d8b',
        success: '#4caf50'
      },
      light: {
        primary: '#ff5023',
        secondary: '#91dc5a',
        accent: '#3f51b5',
        error: '#e91e63',
        warning: '#ffeb3b',
        info: '#607d8b',
        success: '#4caf50'
      }
    }
  }
}

const vuetify = new Vuetify(opts)

export default vuetify
