// Screenshots the options page and adds a Pi-hole through the real form (English UI only):
// permission (pre-granted in the dev build) → test login → save.
import { args, baseSettings, capture, launch, PIHOLE_PASSWORD, seed, sleep } from './lib.mjs'

const { extensionDir, outDir } = args()
const ext = await launch(extensionDir, outDir)
const url = (hash) => `chrome-extension://${ext.extensionId}/options.html#${hash}`
const garage = { id: 'garage', name: 'Garage', url: 'http://10.0.0.5', password: 'x' }

await seed(ext.worker, baseSettings({ instances: [garage], requestTimeoutMs: 3000 }))
const page = await ext.context.newPage()
await page.goto(url('/pi-holes'))
await sleep(2500)
await capture(page, outDir, '01-instances-garage-only')

await page.goto(url('/pi-holes/new'))
await sleep(500)
await page.fill('#instance-name', 'Home')
await page.fill('#instance-url', 'localhost:9810/admin')
await page.fill('#instance-password', PIHOLE_PASSWORD)
await capture(page, outDir, '02-instances-new-form')
await page.getByRole('button', { name: 'Save', exact: true }).click()
await sleep(4000)
const afterSave = await capture(page, outDir, '03-instances-after-save')
if (!afterSave.includes('http://localhost:9810')) throw new Error('the new instance did not show up after saving')

await page.getByRole('button', { name: 'Edit Home', exact: true }).click()
await sleep(1000)
await capture(page, outDir, '04-instances-editing-home')

for (const [name, hash] of [
  ['05-general', '/general'],
  ['06-shortcuts', '/shortcuts'],
  ['07-about', '/about']
]) {
  await page.goto(url(hash))
  await sleep(800)
  await capture(page, outDir, name)
}

await page.goto(url('/general'))
await sleep(500)
await page.getByRole('radio', { name: 'Light', exact: true }).click()
await sleep(800)
await page.goto(url('/pi-holes'))
await sleep(2500)
await capture(page, outDir, '08-instances-light')

await ext.context.close()
console.log('done')
