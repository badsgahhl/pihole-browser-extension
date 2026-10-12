# End-to-end checks

Scripts that load the built extension into a headless Chromium and drive it against a local Pi-hole. They are
not part of CI; run them before a release or after changes to the popup, the options page, sessions or the
migration.

## Setup

A throwaway Pi-hole v6 in Docker, with a known password:

```bash
docker run -d --name pihole-switch-test -p 9810:80 -e FTLCONF_webserver_api_password=switch-test pihole/pihole:latest
```

Wait until `http://localhost:9810/admin/` answers. The default gravity list makes `ad.doubleclick.net` a
blocked domain, which the scripts use as the "current site" (served locally, nothing leaves the machine).

A development build that may talk to the Pi-hole and see the fake site's tab without a permission prompt:

```bash
WXT_DEV_HOST_PERMISSIONS="http://localhost:9810/*,https://ad.doubleclick.net/*" pnpm exec wxt build --mode development
```

Then, in this folder:

```bash
npm install
npx playwright install chromium
```

## Scripts

| Script                                                     | What it does                                                                                              |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `npm run popup`                                            | Popup states through the real buttons: active, paused, allowed, light, denied, no Pi-hole, wrong password |
| `npm run options`                                          | Adds a Pi-hole through the real form (permission → test → save), then every options page, dark and light  |
| `npm run pages`                                            | Every options page without interaction; `CHROME_LANG=de` for German                                       |
| `npm run migration`                                        | Seeds version 4 storage, reloads the extension, checks the migrated settings and the cleanup              |
| `npm run a11y`                                             | axe-core over popup and options pages in both themes; serious and critical violations fail                |
| `node sessions.mjs ../.output/chrome-mv3-dev out/sessions` | Counts API sessions on the Pi-hole: one while configured, none after removal                              |

Screenshots and text dumps land in `out/`. Environment: `PIHOLE_URL`, `PIHOLE_PASSWORD`, `SITE_HOST`,
`CHROME_LANG`.

Afterwards: `docker rm -f pihole-switch-test`.
