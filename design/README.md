# Design assets for v5

Everything visual for the Vue 3 rewrite lives here. The source of truth is the design canvas on claude.ai
("Pi-hole Switch v5 Mockups"); `canvas/` holds a copy of its artboards.

| Folder | What it is |
| --- | --- |
| `canvas/` | The artboards as `.dc.html` plus `canvas.json`, copied from the design canvas. Edit there, then copy back here. |
| `mockups/` | Plain HTML copies of every artboard, generated. Open `mockups/index.html` for a gallery. `mockups/png/` are 2x renders. |
| `icons/` | `icon.svg` is the store and management icon on a dark tile, `icon-toolbar.svg` the transparent toolbar icon. `icons/png/` holds the rasters the manifests will use. |
| `store/` | Chrome Web Store, Edge Add-ons and AMO listing images: five screenshots at 1280×800, a promo tile at 440×280 and a marquee at 1400×560. `store/src/` are the HTML compositions they are rendered from. `store/listing.md` holds the listing texts. |

## Decisions captured here

- Popup variant A, the dense "console" layout, is the one to build. Variant B stays on the canvas for reference only.
- Instance chips in the popup header show the state of each Pi-hole. They are not tabs: every switch, allow and deny action goes to all connected Pi-holes at once, as in v4.
- Square everywhere: 3 px radius, 1 px hairlines, Inter for text, JetBrains Mono for numbers, domains and shortcut hints.
- Dark and light follow the browser; both palettes are in the artboards.

## Icons in the extension

The manifest uses copies of `icons/png/`: `icon-16/32/48/96/128.png` and `toolbar-16/32/48.png` live in
`src/public/icons/`. After changing the SVGs, run the build below and copy those eight files over.

## Regenerating

```bash
cd design
npm install
npx playwright install chromium
npm run build
```

`build.js` reads `canvas/`, writes `mockups/`, `icons/png/` and `store/`.
