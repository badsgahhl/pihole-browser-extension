// Screenshots the popup in its states by driving the real buttons (English UI only).
import { args, baseSettings, capture, click, launch, openPopup, openSite, seed, setBlocking } from './lib.mjs'

const { extensionDir, outDir } = args()
const ext = await launch(extensionDir, outDir, { deviceScaleFactor: 2 })
const site = await openSite(ext.context)
const shot = (page, name) => capture(page, outDir, name, { clipToApp: true })

await setBlocking(true)
await seed(ext.worker, baseSettings())
let popup = await openPopup(ext, site)
await shot(popup, '01-active-dark')

await click(popup, '5m')
await shot(popup, '02-paused-dark')

await click(popup, /Enable now/)
await click(popup, /^Allow$/)
await shot(popup, '03-allowed-dark')
await popup.close()

await seed(ext.worker, baseSettings({ theme: 'light' }))
popup = await openPopup(ext, site)
await shot(popup, '04-allowed-light')
await click(popup, /^Deny$/)
await shot(popup, '05-denied-light')
await click(popup, /Remove from denylist/)
await shot(popup, '06-cleared-light')
await popup.close()

await seed(ext.worker, baseSettings({ instances: [] }))
popup = await openPopup(ext, site)
await shot(popup, '07-needs-setup')
await popup.close()

await seed(ext.worker, baseSettings({ instances: [{ ...baseSettings().instances[0], password: 'nope' }] }))
popup = await openPopup(ext, site)
await shot(popup, '08-wrong-password')
await popup.close()

await ext.context.close()
console.log('done')
