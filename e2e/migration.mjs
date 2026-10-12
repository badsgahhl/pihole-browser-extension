// Seeds the storage of extension version 4 and relaunches the browser profile, which runs the migration from
// bootstrap(). Then checks the v5 settings, the marker and that the legacy keys are gone.
import { args, launch, PIHOLE_PASSWORD, PIHOLE_URL, sleep } from './lib.mjs'

const { extensionDir, outDir } = args()
let ext = await launch(extensionDir, outDir)
const origin = new URL(PIHOLE_URL).origin

await ext.worker.evaluate(
  async ({ origin, password }) => {
    await chrome.storage.local.clear()
    await chrome.storage.local.set({
      pi_hole_settings: [
        { pi_uri_base: `${origin}/admin`, api_key: password },
        { pi_uri_base: 'not a url at all ::::', api_key: 'x' }
      ],
      default_disable_time: 60,
      reload_after_disable: true,
      reload_after_white_list: false,
      disable_list_feature: false,
      disable_context_menu: true,
      disable_update_notification: true,
      beta_feature_flag: false,
      // v4 wrapped the session id like its other cached values; a bare string is junk that must go too.
      [`session_storage_${origin}`]: { value: 'stale-session-id-from-v4' },
      'session_storage_http://old.example': 'not-the-v4-shape'
    })
  },
  { origin, password: PIHOLE_PASSWORD }
)

// An upgrade restarts the extension. Closing and relaunching the same profile does the same: the
// worker boots, bootstrap() finds the v4 keys and migrates them.
await ext.context.close()
ext = await launch(extensionDir, outDir)
await sleep(5000)

const all = await ext.worker.evaluate(() => chrome.storage.local.get(null))
const settings = all.settings
const failures = []
const expect = (condition, message) => {
  if (!condition) failures.push(message)
}

expect(settings?.instances?.length === 1, 'exactly the valid instance was migrated')
expect(settings?.instances?.[0]?.url === origin, `url normalized to ${origin}`)
expect(settings?.instances?.[0]?.password === PIHOLE_PASSWORD, 'api_key became the password')
expect(settings?.instances?.[0]?.name === new URL(origin).hostname, 'name defaults to the hostname')
expect(settings?.pause?.defaultSeconds === 60, 'default_disable_time became pause.defaultSeconds')
expect(settings?.reloadAfterPause === true, 'reload_after_disable became reloadAfterPause')
expect(settings?.reloadAfterAllow === false, 'reload_after_white_list became reloadAfterAllow')
expect(settings?.showCurrentSite === true, 'disable_list_feature false became showCurrentSite true')
expect(settings?.contextMenu === false, 'disable_context_menu true became contextMenu false')
expect(typeof all.migratedFrom === 'object' && all.migratedFrom !== null, 'migration marker written')
for (const key of Object.keys(all)) {
  expect(
    !/^(pi_hole_settings|default_disable_time|reload_after_|disable_|beta_feature_flag|session_storage_)/.test(key),
    `legacy key removed: ${key}`
  )
}
expect(
  ['enabled', 'paused', 'mixed'].includes(all.state?.overall),
  `state refreshed after migration and the Pi-hole answered (got ${all.state?.overall})`
)

console.log(JSON.stringify({ settings, migratedFrom: all.migratedFrom, overall: all.state?.overall }, null, 2))
await ext.context.close()
if (failures.length > 0) {
  console.error('MIGRATION CHECK FAILED:\n- ' + failures.join('\n- '))
  process.exit(1)
}
console.log('migration check passed')
