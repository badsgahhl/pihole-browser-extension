// Counts the API sessions the extension holds on the Pi-hole: one while configured, none after the
// instance is removed, none left behind by repeated refreshes.
import { args, baseSettings, launch, seed, sleep, withPihole } from './lib.mjs'

const { extensionDir, outDir } = args()

/** Valid sessions other than the one this script uses, with a one-line description of each. */
const othersCount = () =>
  withPihole(async (api) => {
    const { sessions } = await api('/auth/sessions')
    const others = sessions.filter((session) => session.valid && !session.current_session)
    for (const session of others) {
      console.log(
        `    #${session.id} app=${session.app} tls=${session.tls?.login} ua=${(session.user_agent ?? '').slice(0, 40)} login=${session.login_at} last=${session.last_active}`
      )
    }
    return others.length
  })

// Earlier runs killed the browser without logging out; start from a clean slate.
await withPihole(async (api) => {
  const { sessions } = await api('/auth/sessions')
  for (const session of sessions) {
    if (session.valid && !session.current_session) await api(`/auth/session/${session.id}`, { method: 'DELETE' })
  }
})
const before = await othersCount()
console.log('sessions before:', before)

const ext = await launch(extensionDir, outDir)
await seed(ext.worker, baseSettings())
// Seeding storage directly triggers nothing; the first status refresh logs in. Fire the alarm the
// background uses for that instead of waiting a minute.
const refresh = () => ext.worker.evaluate(() => chrome.alarms.create('status-refresh', { when: Date.now() + 10 }))
await refresh()
await sleep(3000)
const whileConfigured = await othersCount()
console.log('sessions while configured:', whileConfigured)

// Refreshing again must reuse the session, not open another one.
for (let i = 0; i < 3; i++) {
  await ext.worker.evaluate(() => chrome.storage.local.remove(['state']))
  await refresh()
  await sleep(1500)
}
const afterRefreshes = await othersCount()
console.log('sessions after three refreshes:', afterRefreshes)

// Removal through the real UI: only the background's saveSettings path logs the instance out.
const page = await ext.context.newPage()
await page.goto(`chrome-extension://${ext.extensionId}/options.html#/pi-holes`)
await sleep(1500)
await page.getByRole('button', { name: 'Remove Home', exact: true }).click()
await sleep(500)
await page.screenshot({ path: `${outDir}/dialog.png` })
console.log('dialog text:', JSON.stringify((await page.evaluate(() => document.body.innerText)).slice(-300)))
await page.getByRole('alertdialog').getByRole('button', { name: 'Remove', exact: true }).click()
await sleep(3000)
await page.screenshot({ path: `${outDir}/after-removal.png` })
const remaining = await page.evaluate(() => document.body.innerText)
console.log('page after removal:', JSON.stringify(remaining.slice(0, 400)))
if (remaining.includes('http://localhost')) throw new Error('the instance is still listed after removal')
const afterRemoval = await othersCount()
console.log('sessions after removing the instance:', afterRemoval)

await ext.context.close()
const failures = []
if (whileConfigured !== before + 1)
  failures.push(`expected ${before + 1} session(s) while configured, got ${whileConfigured}`)
if (afterRefreshes !== before + 1) failures.push(`refreshes leaked sessions: ${afterRefreshes}`)
if (afterRemoval !== before) failures.push(`session not closed on removal: ${afterRemoval}`)
if (failures.length > 0) {
  console.error('SESSION CHECK FAILED:\n- ' + failures.join('\n- '))
  process.exit(1)
}
console.log('session check passed')
