import '@/assets/index.css'
import { createApp } from 'vue'

import OptionsApp from './OptionsApp.vue'
import { createOptionsRouter } from './router'

createApp(OptionsApp).use(createOptionsRouter()).mount('#app')
