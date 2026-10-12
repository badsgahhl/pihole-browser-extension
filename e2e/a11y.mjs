// Runs axe-core over the popup and the options pages in both themes. Serious and critical
// violations fail the run; everything is printed.
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

import { args, baseSettings, launch, openPopup, openSite, seed, setBlocking, sleep } from './lib.mjs'

const require = createRequire(import.meta.url)
// Evaluated as a string: Runtime.evaluate is not subject to the extension page's CSP.
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8')

const { extensionDir, outDir } = args()
const ext = await launch(extensionDir, outDir)
const site = await openSite(ext.context)
const findings = []

async function audit(page, name) {
  await page.evaluate(axeSource)
  const result = await page.evaluate(() =>
    axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] } })
  )
  console.log(`--- ${name}: ${result.violations.length} violation type(s), ${result.passes.length} rules passed`)
  for (const violation of result.violations) {
    const sample = violation.nodes[0]
    console.log(
      `  [${violation.impact}] ${violation.id}: ${violation.help} (${violation.nodes.length}x) e.g. ${sample?.target?.[0]}`
    )
    if (sample?.failureSummary) console.log(`      ${sample.failureSummary.split('\n').join(' ')}`)
    findings.push({ page: name, ...violation, nodes: undefined })
  }
}

for (const theme of ['dark', 'light']) {
  await setBlocking(true)
  await seed(
    ext.worker,
    baseSettings({
      theme,
      instances: [...baseSettings().instances, { id: 'garage', name: 'Garage', url: 'http://10.0.0.5', password: 'x' }],
      requestTimeoutMs: 3000
    })
  )
  await sleep(2500)
  const popup = await openPopup(ext, site)
  await audit(popup, `popup active ${theme}`)
  await popup.getByRole('button', { name: '5m', exact: true }).click()
  await sleep(4000)
  console.log(
    'popup text after pausing:',
    JSON.stringify((await popup.evaluate(() => document.body.innerText)).slice(0, 200))
  )
  await audit(popup, `popup paused ${theme}`)
  await popup.getByRole('button', { name: /Enable now/ }).click()
  await sleep(2500)
  await popup.close()

  const page = await ext.context.newPage()
  for (const [name, hash] of [
    ['instances', '/pi-holes/home'],
    ['general', '/general'],
    ['shortcuts', '/shortcuts'],
    ['about', '/about']
  ]) {
    await page.goto(`chrome-extension://${ext.extensionId}/options.html#${hash}`)
    await sleep(1500)
    await audit(page, `options ${name} ${theme}`)
  }
  await page.close()
}

await ext.context.close()
await setBlocking(true)
const blocking = findings.filter((finding) => finding.impact === 'serious' || finding.impact === 'critical')
console.log(`\n${findings.length} finding(s), ${blocking.length} serious or critical`)
process.exit(blocking.length > 0 ? 1 : 0)
