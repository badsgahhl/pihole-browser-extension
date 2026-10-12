import { browser, defineBackground } from '#imports'

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener((details) => {
    console.info('[pihole-switch] installed', details.reason)
  })
})
