import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

/** Runs a composable inside a throwaway component so lifecycle hooks and injections work. */
export function mountComposable<T>(factory: () => T): { result: T; wrapper: VueWrapper } {
  let result!: T
  const Host = defineComponent({
    setup() {
      result = factory()
      return () => h('div')
    }
  })
  const wrapper = mount(Host)
  return { result, wrapper }
}
