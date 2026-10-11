// Builds the v5 design deliverables from the canvas artboards:
//  1. plain HTML copies of every artboard under design/mockups (+ PNG renders)
//  2. icon PNGs from design/icons/*.svg
//  3. store screenshots, promo tile and marquee under design/store
'use strict'
const fs = require('fs')
const path = require('path')
const { chromium } = require('playwright')
const sharp = require('sharp')

const REPO = path.join(__dirname, '..')
const CANVAS = path.join(__dirname, 'canvas')
const MOCK = path.join(REPO, 'design/mockups')
const ICONS = path.join(REPO, 'design/icons')
const STORE = path.join(REPO, 'design/store')

const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700&family=JetBrains+Mono:wght@400;500;600&display=swap">'

const BOARDS = [
  { file: 'Main.dc.html', name: 'popup-a-dark-active', w: 320, h: 356 },
  { file: 'PopupA-Paused.dc.html', name: 'popup-a-dark-paused', w: 320, h: 356 },
  { file: 'PopupA-Light.dc.html', name: 'popup-a-light-allowed', w: 320, h: 356 },
  { file: 'PopupB.dc.html', name: 'popup-b-dark-active', w: 320, h: 456 },
  { file: 'PopupB-Light.dc.html', name: 'popup-b-light-blocked', w: 320, h: 456 },
  { file: 'Options-Instances.dc.html', name: 'options-instances', w: 1280, h: 800 },
  { file: 'Options-General.dc.html', name: 'options-general', w: 1280, h: 800 },
]

function parseBoard(src) {
  const title = src.match(/<title>([^<]*)<\/title>/)[1]
  const helmet = src.match(/<helmet>([\s\S]*?)<\/helmet>/)[1]
  const body = src.match(/<\/helmet>([\s\S]*?)<\/x-dc>/)[1].trim()
  return { title, helmet: helmet.replace(/&amp;/g, '&'), body }
}

function plainPage({ title, helmet, body }, extraCss = '') {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
${helmet.trim()}
<style>
body { margin: 0; background: #15181d; min-height: 100vh; display: flex; align-items: flex-start; justify-content: center; padding: 40px 16px; box-sizing: border-box; }
${extraCss}
</style>
</head>
<body>
${body}
</body>
</html>
`
}

function ensure(dir) { fs.mkdirSync(dir, { recursive: true }) }

async function buildMockups(browser) {
  ensure(path.join(MOCK, 'png'))
  const frags = {}
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2 })
  for (const b of BOARDS) {
    const src = fs.readFileSync(path.join(CANVAS, b.file), 'utf8')
    const parsed = parseBoard(src)
    frags[b.name] = parsed.body
    const isPage = b.w >= 1000
    const html = plainPage(parsed, isPage ? 'body { padding: 0; display: block; } body > div { min-height: 100vh; }' : '')
    fs.writeFileSync(path.join(MOCK, `${b.name}.html`), html)
    await page.setViewportSize({ width: isPage ? b.w : 1400, height: isPage ? b.h : 900 })
    await page.setContent(html, { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    const target = page.locator('body > div').first()
    await target.screenshot({ path: path.join(MOCK, 'png', `${b.name}.png`) })
    console.log('mockup', b.name)
  }
  await page.close()

  // gallery
  const cards = BOARDS.map(b => `<a class="card" href="./${b.name}.html"><img src="./png/${b.name}.png" alt="${b.name}" style="width:${b.w >= 1000 ? 640 : b.w}px"><span>${b.name}</span></a>`).join('\n')
  fs.writeFileSync(path.join(MOCK, 'index.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Pi-hole Switch v5 mockups</title>${FONTS}
<style>
body{margin:0;background:#15181d;color:#f2f4f7;font-family:Inter,system-ui,sans-serif;padding:32px}
h1{font-size:18px;font-weight:600;margin:0 0 4px}
p{color:#808997;font-size:13px;margin:0 0 24px}
.grid{display:flex;flex-wrap:wrap;gap:24px;align-items:flex-start}
.card{display:flex;flex-direction:column;gap:8px;text-decoration:none;color:#a6aeba;font-family:'JetBrains Mono',monospace;font-size:11px}
.card img{display:block;border:1px solid #262a31;border-radius:3px;background:#0a0c0f}
</style></head><body>
<h1>Pi-hole Switch v5 mockups</h1>
<p>Static HTML copies of the design canvas. Variant A is the dense console, variant B the card layout. Click a tile to open the page.</p>
<div class="grid">
${cards}
</div></body></html>
`)
  return frags
}

async function buildIcons() {
  ensure(path.join(ICONS, 'png'))
  const sets = [
    { svg: 'icon.svg', prefix: 'icon', sizes: [16, 32, 48, 96, 128, 256, 512] },
    { svg: 'icon-toolbar.svg', prefix: 'toolbar', sizes: [16, 19, 32, 38, 48] },
  ]
  for (const s of sets) {
    const svg = fs.readFileSync(path.join(ICONS, s.svg))
    for (const size of s.sizes) {
      await sharp(svg, { density: Math.max(72, (72 * size) / 512 * 8) })
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(path.join(ICONS, 'png', `${s.prefix}-${size}.png`))
    }
    console.log('icons', s.prefix)
  }
}

const LOGO_SVG = fs.readFileSync(path.join(ICONS, 'icon.svg'), 'utf8').replace(/<title>[^<]*<\/title>/, '')
const BADGE_SVG = `<svg width="20" height="20" viewBox="0 0 512 512" aria-hidden="true">${fs.readFileSync(path.join(ICONS, 'icon-toolbar.svg'), 'utf8').replace(/^[\s\S]*?<title>[^<]*<\/title>/, '').replace(/<\/svg>\s*$/, '')}</svg>`

function browserFrame(inner, { url = 'news.example.com', popupTop = 44, badge = 'ON', badgeColor = '#1b7a3e', width = 760, height = 600 } = {}) {
  return `
<div class="frame" style="width:${width}px;height:${height}px">
  <div class="toolbar">
    <div class="dots"><span></span><span></span><span></span></div>
    <div class="nav"><span>‹</span><span>›</span><span>↻</span></div>
    <div class="address"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#45d483" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="1"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>${url}</div>
    <div class="ext"><span class="ext-icon">${BADGE_SVG}<span class="badge" style="background:${badgeColor}">${badge}</span></span><span class="ext-more">⋮</span></div>
  </div>
  <div class="viewport">
    <div class="site">
      <div class="site-bar"></div>
      <div class="site-h"></div>
      <div class="site-p"></div><div class="site-p short"></div><div class="site-p"></div>
      <div class="site-grid"><div></div><div></div><div></div></div>
    </div>
    <div class="popup" style="top:${popupTop}px">${inner}</div>
  </div>
</div>`
}

const STORE_CSS = `
*{box-sizing:border-box}
body{margin:0;background:#0a0c0f;color:#f2f4f7;font-family:Inter,system-ui,sans-serif;letter-spacing:-0.01em;overflow:hidden}
.shot{position:relative;width:1280px;height:800px;background:#0a0c0f;overflow:hidden;display:flex;align-items:center;padding:0 0 0 72px;gap:48px}
.shot::before{content:"";position:absolute;inset:0;background-image:linear-gradient(#171a1f 1px,transparent 1px),linear-gradient(90deg,#171a1f 1px,transparent 1px);background-size:40px 40px;opacity:.55;mask-image:linear-gradient(180deg,rgba(0,0,0,.9),rgba(0,0,0,.2))}
.copy{position:relative;width:420px;flex-shrink:0;display:flex;flex-direction:column;gap:18px}
.eyebrow{display:inline-flex;align-items:center;gap:8px;font-family:'JetBrains Mono',monospace;font-size:12px;color:#38d0ea;letter-spacing:.04em;text-transform:uppercase}
.eyebrow::before{content:"";width:8px;height:8px;background:#38d0ea}
h1{margin:0;font-size:44px;line-height:1.08;font-weight:700;letter-spacing:-0.03em}
.sub{font-size:17px;line-height:1.45;color:#a6aeba;margin:0}
.bullets{display:flex;flex-direction:column;gap:10px;margin-top:6px}
.bullets div{display:flex;align-items:center;gap:10px;font-size:14px;color:#f2f4f7}
.bullets div::before{content:"";width:6px;height:6px;background:#45d483;flex-shrink:0}
.bullets code{font-family:'JetBrains Mono',monospace;font-size:12px;color:#a6aeba;border:1px solid #3a404a;border-radius:2px;padding:1px 5px}
.stage{position:relative;flex:1;height:100%;display:flex;align-items:center}
.frame{position:relative;border:1px solid #262a31;border-radius:3px;background:#101318;box-shadow:0 30px 80px rgba(0,0,0,.6);overflow:hidden;display:flex;flex-direction:column}
.toolbar{height:44px;display:flex;align-items:center;gap:12px;padding:0 12px;background:#171a1f;border-bottom:1px solid #262a31;flex-shrink:0}
.dots{display:flex;gap:6px}.dots span{width:10px;height:10px;border-radius:50%;background:#3a404a}
.nav{display:flex;gap:10px;color:#808997;font-size:16px}
.address{flex:1;height:28px;border:1px solid #262a31;border-radius:3px;background:#0a0c0f;color:#a6aeba;font-family:'JetBrains Mono',monospace;font-size:12px;display:flex;align-items:center;gap:8px;padding:0 10px}
.ext{display:flex;align-items:center;gap:10px;color:#808997}
.ext-icon{position:relative;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:3px;background:#22262d;border:1px solid #3a404a}
.badge{position:absolute;right:-6px;bottom:-5px;height:13px;padding:0 3px;border-radius:2px;color:#fff;font-family:'JetBrains Mono',monospace;font-size:8.5px;font-weight:700;display:flex;align-items:center;border:1px solid #171a1f}
.viewport{position:relative;flex:1;background:#0c0e11}
.site{padding:28px 36px;display:flex;flex-direction:column;gap:14px;opacity:.9}
.site-bar{height:14px;width:160px;background:#22262d}
.site-h{height:30px;width:420px;background:#2a2f37;margin-top:8px}
.site-p{height:10px;width:520px;background:#1d2128}.site-p.short{width:380px}
.site-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:10px}.site-grid div{height:120px;background:#171a1f;border:1px solid #22262d}
.popup{position:absolute;right:14px;box-shadow:0 24px 60px rgba(0,0,0,.7)}
.popup > div{border-color:#3a404a !important}
.options-wrap{position:relative;width:1280px;height:800px;transform-origin:top left}
.tile{width:440px;height:280px;background:#0a0c0f;display:flex;align-items:center;gap:28px;padding:0 40px;position:relative;overflow:hidden}
.tile::before{content:"";position:absolute;inset:0;background-image:linear-gradient(#171a1f 1px,transparent 1px),linear-gradient(90deg,#171a1f 1px,transparent 1px);background-size:32px 32px;opacity:.5}
.tile .logo{position:relative;width:128px;height:128px;flex-shrink:0}
.tile .t{position:relative;display:flex;flex-direction:column;gap:6px}
.tile .t b{font-size:30px;font-weight:700;letter-spacing:-0.03em;line-height:1.05}
.tile .t span{font-size:15px;color:#a6aeba}
.tile .t .tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.tile .t .tags i{white-space:nowrap;font-style:normal;font-family:'JetBrains Mono',monospace;font-size:11px;color:#38d0ea;border:1px solid #1f4a55;background:#08262c;border-radius:3px;padding:3px 7px}
.marquee{width:1400px;height:560px;background:#0a0c0f;display:flex;align-items:center;padding:0 88px;gap:60px;position:relative;overflow:hidden}
.marquee::before{content:"";position:absolute;inset:0;background-image:linear-gradient(#171a1f 1px,transparent 1px),linear-gradient(90deg,#171a1f 1px,transparent 1px);background-size:40px 40px;opacity:.5}
.marquee .copy{width:560px}
.marquee h1{font-size:56px}
.marquee .stage{justify-content:flex-end}
`

function shotPage(body) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>store</title>${FONTS}<style>${STORE_CSS}</style></head><body>${body}</body></html>`
}

// Popup A with a plain, unblocked site: used where the site card is not the point.
function variantNotBlocked(frag) {
  return frag
    .replace(/ads\.google\.com/g, 'news.example.com')
    .replace('<div style="font-size: 11px; color: #ff4d42">Blocked by list StevenBlack hosts</div>', '<div style="font-size: 11px; color: #808997">Not blocked · not on any list</div>')
    .replace('stroke="#ff4d42" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink: 0"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m8.5 8.5 7 7"></path></svg>', 'stroke="#808997" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink: 0"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>')
}

async function buildStore(browser, frags) {
  ensure(path.join(STORE, 'src'))
  const shots = [
    {
      name: 'screenshot-1-pause',
      body: `<div class="shot"><div class="copy"><div class="eyebrow">Blocking control</div><h1>Pause blocking with one click.</h1><p class="sub">Presets from ten seconds to an hour, or for good. Blocking resumes on its own and the badge counts down.</p><div class="bullets"><div>Every connected Pi-hole switches together</div><div>Hotkey <code>T</code> and the page context menu do the same</div><div>Tab reloads once DNS is clear</div></div></div><div class="stage">${browserFrame(variantNotBlocked(frags['popup-a-dark-active']), { url: 'news.example.com' })}</div></div>`,
    },
    {
      name: 'screenshot-2-site',
      body: `<div class="shot"><div class="copy"><div class="eyebrow">Current site</div><h1>See why a page is blocked.</h1><p class="sub">The domain of the open tab, which list caught it, and allow or deny with one key. Temporary allow for ten minutes when you just need to get through.</p><div class="bullets"><div>Allow <code>A</code> · Deny <code>D</code></div><div>Applies to all Pi-holes at once</div><div>Entries are removable from the same spot</div></div></div><div class="stage">${browserFrame(frags['popup-a-dark-active'], { url: 'ads.google.com', badge: 'ON' })}</div></div>`,
    },
    {
      name: 'screenshot-3-paused',
      body: `<div class="shot"><div class="copy"><div class="eyebrow">Timer</div><h1>Paused, with a way back.</h1><p class="sub">A live countdown, one button to resume early, and quick extensions when five minutes were not enough.</p><div class="bullets"><div>Badge shows the remaining time</div><div>Nothing is filtered while paused, and the popup says so</div><div>Resumes even if the browser is closed</div></div></div><div class="stage">${browserFrame(frags['popup-a-dark-paused'], { url: 'app.example-bank.com', badge: '4:32', badgeColor: '#875900' })}</div></div>`,
    },
    {
      name: 'screenshot-4-light',
      body: `<div class="shot"><div class="copy"><div class="eyebrow">Themes</div><h1>Light or dark, like your browser.</h1><p class="sub">Follows the system theme or a fixed choice. Square, quiet, and readable at a glance.</p><div class="bullets"><div>Allowed and denied entries show who added them</div><div>Version check and update hint in the footer</div><div>Several Pi-holes as tabs</div></div></div><div class="stage">${browserFrame(frags['popup-a-light-allowed'], { url: 'cdn.example-shop.com' })}</div></div>`,
    },
    {
      name: 'screenshot-5-options',
      body: `<div class="shot" style="padding-left:56px;gap:36px"><div class="copy" style="width:360px"><div class="eyebrow">Settings</div><h1>Several Pi-holes, one switch.</h1><p class="sub">Add each instance with its own name and password, test the connection, and grant access per address only.</p><div class="bullets"><div>Session reuse, no more seat limits</div><div>Export and import your settings</div><div>Badge, context menu and reload options</div></div></div><div class="stage"><div class="frame" style="width:800px;height:520px"><div class="toolbar"><div class="dots"><span></span><span></span><span></span></div><div class="address">chrome-extension://…/options.html</div></div><div class="viewport" style="overflow:hidden"><div class="options-wrap" style="transform:scale(0.625)">${frags['options-instances']}</div></div></div></div></div>`,
    },
  ]
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 })
  for (const s of shots) {
    const html = shotPage(s.body)
    fs.writeFileSync(path.join(STORE, 'src', `${s.name}.html`), html)
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.setContent(html, { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    await page.screenshot({ path: path.join(STORE, `${s.name}.png`), clip: { x: 0, y: 0, width: 1280, height: 800 } })
    console.log('store', s.name)
  }

  const tile = shotPage(`<div class="tile"><div class="logo">${LOGO_SVG.replace('<svg ', '<svg style="width:128px;height:128px" ')}</div><div class="t"><b>Pi-hole Switch</b><span>Toggle, pause, allow, deny. From the toolbar.</span><div class="tags"><i>Pi-hole v6</i><i>Chrome · Edge · Firefox</i></div></div></div>`)
  fs.writeFileSync(path.join(STORE, 'src', 'promo-tile-440x280.html'), tile)
  await page.setViewportSize({ width: 440, height: 280 })
  await page.setContent(tile, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: path.join(STORE, 'promo-tile-440x280.png'), clip: { x: 0, y: 0, width: 440, height: 280 } })
  console.log('store promo tile')

  const marquee = shotPage(`<div class="marquee"><div class="copy"><div class="eyebrow">Browser extension for Pi-hole v6</div><h1>Your Pi-hole, one click away.</h1><p class="sub">Pause blocking, allow or deny the current site, keep an eye on several Pi-holes. Square, fast, keyboard friendly.</p></div><div class="stage">${browserFrame(frags['popup-a-dark-active'], { url: 'ads.google.com', width: 600, height: 470, popupTop: 40 })}</div></div>`)
  fs.writeFileSync(path.join(STORE, 'src', 'marquee-1400x560.html'), marquee)
  await page.setViewportSize({ width: 1400, height: 560 })
  await page.setContent(marquee, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: path.join(STORE, 'marquee-1400x560.png'), clip: { x: 0, y: 0, width: 1400, height: 560 } })
  console.log('store marquee')
  await page.close()
}

;(async () => {
  const browser = await chromium.launch()
  try {
    const frags = await buildMockups(browser)
    await buildIcons()
    await buildStore(browser, frags)
  } finally {
    await browser.close()
  }
  console.log('done')
})().catch((e) => { console.error(e); process.exit(1) })
