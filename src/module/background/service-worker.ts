import BackgroundInitializer from './init/BackgroundInitializer'

chrome.runtime.onInstalled.addListener(() => {
  new BackgroundInitializer().init()
})
chrome.runtime.onStartup.addListener(() => {
  new BackgroundInitializer().init()
})
