// Screenshots every options page without interacting, so it works in any UI language
// (CHROME_LANG=de for German).
import { args, baseSettings, capture, launch, seed, sleep } from './lib.mjs'

const { extensionDir, outDir } = args()
const ext = await launch(extensionDir, outDir)
await seed(
  ext.worker,
  baseSettings({
    instances: [...baseSettings().instances, { id: 'garage', name: 'Garage', url: 'http://10.0.0.5', password: 'x' }],
    requestTimeoutMs: 3000
  })
)
await sleep(2000)

const page = await ext.context.newPage()
for (const [name, hash] of [
  ['instances', '/pi-holes/home'],
  ['general', '/general'],
  ['shortcuts', '/shortcuts'],
  ['about', '/about']
]) {
  await page.goto(`chrome-extension://${ext.extensionId}/options.html#${hash}`)
  await sleep(1500)
  await capture(page, outDir, name)
}
await ext.context.close()
console.log('done')
