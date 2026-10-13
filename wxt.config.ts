import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'wxt'

// Firefox add-on id as assigned by AMO for the existing listing. MV3 requires it to be explicit.
const FIREFOX_ID = '{a4cc20af-d30a-4758-a799-2089ce45f452}'

// Development builds only: origins granted at install so automated checks need no permission prompt,
// e.g. WXT_DEV_HOST_PERMISSIONS="http://localhost:9810/*". Production manifests never carry these.
const devHostPermissions = (process.env.WXT_DEV_HOST_PERMISSIONS ?? '')
  .split(',')
  .map((pattern) => pattern.trim())
  .filter(Boolean)

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
    // Test files are excluded by WXT's own default pattern.
    excludeSources: ['design/**', 'e2e/**', 'coverage/**', 'src/test/**']
  },
  manifest: ({ browser, mode }) => ({
    name: 'PiHole Browser Extension',
    description: '__MSG_extDescription__',
    default_locale: 'en',
    homepage_url: 'https://github.com/badsgahhl/pihole-browser-extension',
    permissions: ['storage', 'alarms', 'activeTab', 'contextMenus'],
    // No host access at install. The options page requests each Pi-hole's origin when it is saved.
    optional_host_permissions: ['http://*/*', 'https://*/*'],
    ...(mode === 'development' && devHostPermissions.length > 0 && { host_permissions: devHostPermissions }),
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
    // AbortSignal.timeout() exists from 103.
    ...(browser === 'chrome' && { minimum_chrome_version: '103' }),
    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: {
          id: FIREFOX_ID,
          // 140 is the oldest supported ESR and the first release that knows data_collection_permissions,
          // which AMO requires; older Firefox versions would only log a manifest warning.
          strict_min_version: '140.0',
          data_collection_permissions: { required: ['none'] }
        }
      },
      // Firefox's default MV3 policy adds upgrade-insecure-requests, which rewrites every request to an
      // http:// Pi-hole into https:// and fails on a self-signed certificate or a plain HTTP port (#123).
      // This is the MV2 default version 4 ran under; Chrome's MV3 default has no upgrade either.
      content_security_policy: { extension_pages: "script-src 'self'; object-src 'self';" }
    })
  })
})
