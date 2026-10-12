import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

import AboutView from './views/AboutView.vue'
import GeneralView from './views/GeneralView.vue'
import InstancesView from './views/InstancesView.vue'
import ShortcutsView from './views/ShortcutsView.vue'

export type SectionName = 'instances' | 'general' | 'shortcuts' | 'about'

declare module 'vue-router' {
  interface RouteMeta {
    section: SectionName
  }
}

export const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/pi-holes' },
  { path: '/pi-holes/:id?', name: 'instances', component: InstancesView, meta: { section: 'instances' } },
  { path: '/general', name: 'general', component: GeneralView, meta: { section: 'general' } },
  { path: '/shortcuts', name: 'shortcuts', component: ShortcutsView, meta: { section: 'shortcuts' } },
  { path: '/about', name: 'about', component: AboutView, meta: { section: 'about' } },
  { path: '/:pathMatch(.*)*', redirect: '/pi-holes' }
]

/** Hash history, so deep links like `options.html#/pi-holes/new` work from the popup and background. */
export function createOptionsRouter() {
  return createRouter({ history: createWebHashHistory(), routes })
}
