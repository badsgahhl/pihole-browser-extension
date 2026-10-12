import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'wxt'

// Firefox add-on id as assigned by AMO for the existing listing. MV3 requires it to be explicit.
const FIREFOX_ID = '{a4cc20af-d30a-4758-a799-2089ce45f452}'

export default defineConfig({
  srcDir: 'src',
  publicDir: 'src/public',
  // Firefox would default to MV2; the extension is MV3 everywhere.
  manifestVersion: 3,
  modules: ['@wxt-dev/module-vue', '@wxt-dev/i18n/module'],
  // Imports stay explicit (`#imports`, `#i18n`), so oxlint needs no auto-import globals.
  imports: false,
  dev: {
    // The four hotkeys already use the command slots browsers allow with suggested keys.
    reloadCommand: false
  },
  vite: () => ({
    plugins: [tailwindcss()]
  }),
  zip: {
    artifactTemplate: '{{name}}-{{packageVersion}}-{{browser}}.zip',
    sourcesTemplate: '{{name}}-{{packageVersion}}-sources.zip',
    excludeSources: ['design/**', 'coverage/**', '**/*.test.ts', 'src/test/**']
  },
  manifest: ({ browser }) => ({
    name: 'PiHole Browser Extension',
    description: '__MSG_extDescription__',
    default_locale: 'en',
    permissions: ['storage', 'alarms', 'activeTab', 'contextMenus'],
    // No host access at install. The options page requests each Pi-hole's origin when it is saved.
    optional_host_permissions: ['http://*/*', 'https://*/*'],
    icons: {
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
      48: 'icons/icon-48.png',
      96: 'icons/icon-96.png',
      128: 'icons/icon-128.png'
    },
    commands: {
      'hotkey-toggle-pihole': { description: '__MSG_commands_toggle__' },
      'hotkey-blacklist-current-domain': { description: '__MSG_commands_deny__' },
      'hotkey-whitelist-current-domain': { description: '__MSG_commands_allow__' },
      'hotkey-open-settings': { description: '__MSG_commands_openSettings__' }
    },
    ...(browser === 'chrome' && { minimum_chrome_version: '102' }),
    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: {
          id: FIREFOX_ID,
          strict_min_version: '128.0',
          data_collection_permissions: { required: ['none'] }
        }
      }
    })
  })
})
