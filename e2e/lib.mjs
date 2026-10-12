// Shared helpers for the e2e scripts: launching Chromium with the built extension, seeding settings
// through the service worker, opening the popup over a fake "current site", and capturing pages.
import { mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { chromium } from 'playwright'

export const PIHOLE_URL = process.env.PIHOLE_URL ?? 'http://localhost:9810'
export const PIHOLE_PASSWORD = process.env.PIHOLE_PASSWORD ?? 'switch-test'
/** Served by route interception, so no internet is needed; the dev build must have host access to it. */
export const SITE_HOST = process.env.SITE_HOST ?? 'ad.doubleclick.net'

export function args() {
  const [extensionDir, outDir] = process.argv.slice(2).map((p) => resolve(p))
  if (!extensionDir || !outDir) {
    console.error('usage: node <script> <extensionDir> <outDir>')
    process.exit(2)
  }
  mkdirSync(outDir, { recursive: true })
  return { extensionDir, outDir }
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export function baseSettings(overrides = {}) {
  return {
    version: 1,
    instances: [{ id: 'home', name: 'Home', url: PIHOLE_URL, password: PIHOLE_PASSWORD }],
    pause: { defaultSeconds: 300, rememberLast: true },
    reloadAfterPause: false,
    reloadAfterAllow: false,
    showCurrentSite: true,
    contextMenu: true,
    badgeMode: 'state',
    theme: 'dark',
    tempAllowMinutes: 10,
    requestTimeoutMs: 5000,
    ...overrides
  }
}

/** Launches a persistent context with the extension loaded. CHROME_LANG=de switches the UI language. */
export async function launch(extensionDir, outDir, options = {}) {
  const context = await chromium.launchPersistentContext(join(outDir, 'profile'), {
    channel: 'chromium',
    headless: true,
    viewport: { width: 1280, height: 860 },
    deviceScaleFactor: 1,
    ...options,
    args: [
      `--disable-extensions-except=${extensionDir}`,
      `--load-extension=${extensionDir}`,
      ...(process.env.CHROME_LANG ? [`--lang=${process.env.CHROME_LANG}`] : [])
    ]
  })
  const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'))
  const extensionId = new URL(worker.url()).host
  // A fresh profile is an install: the extension opens its options page, possibly into the tab a
  // script is about to use. Let that happen, then close every extension page.
  await sleep(1500)
  for (const page of context.pages()) {
    if (page.url().startsWith('chrome-extension://')) await page.close()
  }
  return { context, worker, extensionId }
}

export async function seed(worker, settings) {
  await worker.evaluate(async (value) => {
    await chrome.storage.local.set({ settings: value })
    await chrome.storage.local.remove(['state'])
  }, settings)
  await sleep(800)
}

/** Opens a tab on the fake site so the popup has a "current site" to show. */
export async function openSite(context) {
  await context.route(`https://${SITE_HOST}/**`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: `<!doctype html><title>${SITE_HOST}</title><h1>${SITE_HOST}</h1>`
    })
  )
  const site = await context.newPage()
  await site.goto(`https://${SITE_HOST}/`)
  return site
}

/**
 * Opens popup.html in its own window and hands focus back to the site tab before it loads, so the
 * background resolves that tab as current, like it would under the toolbar button.
 */
export async function openPopup({ context, worker, extensionId }, site) {
  const siteWindowId = await worker.evaluate(
    async () => (await chrome.windows.getAll()).find((w) => w.type === 'normal')?.id
  )
  const pagePromise = context.waitForEvent('page')
  await worker.evaluate(async (id) => {
    await chrome.windows.create({ url: 'about:blank', type: 'popup', width: 340, height: 640, focused: false })
    await chrome.windows.update(id, { focused: true })
  }, siteWindowId)
  const popup = await pagePromise
  await popup.setViewportSize({ width: 320, height: 640 })
  await site.bringToFront()
  await popup.goto(`chrome-extension://${extensionId}/popup.html`)
  await sleep(2500)
  return popup
}

export async function capture(page, outDir, name, { clipToApp = false } = {}) {
  await sleep(400)
  const clip = clipToApp
    ? {
        x: 0,
        y: 0,
        width: 320,
        height: Math.max(
          40,
          await page.evaluate(() => Math.ceil(document.getElementById('app').getBoundingClientRect().height))
        )
      }
    : undefined
  await page.screenshot({ path: join(outDir, `${name}.png`), fullPage: !clip, clip })
  const text = await page.evaluate(() => document.body.innerText)
  console.log(`--- ${name}\n${text.slice(0, 1200)}\n`)
  return text
}

export async function click(page, name) {
  await page.getByRole('button', { name }).first().click()
  await sleep(2500)
}

/** Puts the Pi-hole into a known blocking state, so a run does not inherit the previous one's pause. */
export async function setBlocking(enabled) {
  await withPihole((api) => api('/dns/blocking', { method: 'POST', body: JSON.stringify({ blocking: enabled }) }))
}

/** Talks to the Pi-hole directly from Node, with its own short-lived session. */
export async function withPihole(fn) {
  const login = await fetch(`${PIHOLE_URL}/api/auth`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password: PIHOLE_PASSWORD })
  })
  const sid = (await login.json()).session?.sid
  if (!sid) throw new Error('Pi-hole login from Node failed; is the test instance running?')
  const headers = { 'X-FTL-SID': sid, 'content-type': 'application/json' }
  try {
    return await fn(async (path, init = {}) => {
      const response = await fetch(`${PIHOLE_URL}/api${path}`, { ...init, headers: { ...headers, ...init.headers } })
      return response.status === 204 ? null : response.json()
    })
  } finally {
    await fetch(`${PIHOLE_URL}/api/auth`, { method: 'DELETE', headers })
  }
}
