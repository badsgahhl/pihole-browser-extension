# Changelog

## 5.0.1 · 2026-10-12

### Fixed

- The temporary allow line in the popup spells out its unit ("Allowed for 10 min"); "10m" read like metres in German
  and did not match the button.
- The mark in the popup header, the empty state and the settings sidebar now has the same shape as the toolbar icon.

## 5.0.0 · 2026-10-12

A rewrite for Pi-hole v6. Vue 3, Manifest V3 on every browser, one design for Chrome, Edge and Firefox.

### After the update

- Your Pi-holes and preferences are carried over from version 4. The old session tokens are released on the
  Pi-hole side where possible.
- The browser asks once for access to each Pi-hole address. Version 5 no longer requests access to all websites;
  on Firefox the move to Manifest V3 also resets the permissions of version 4. The popup and the settings show a
  **Grant access** button until you have confirmed it.
- Pi-hole v5 is no longer supported. Stay on 4.x for it.

### Added

- Popup with the state of every Pi-hole, a countdown while paused, and the blocked percentage of the day.
- Pause presets (10 s, 30 s, 5 min, 30 min, 1 h, indefinitely) and a custom duration; the last choice can become
  the default. `+5m` and `+1h` extend a running pause.
- The current site: blocked by which list, blocked or allowed by you, or not blocked (#107). Allow and deny with
  one click; **Allow for 10 minutes** adds a temporary entry that is removed again automatically (#39).
- Keyboard keys inside the popup: `T`, `A`, `D`, `1`–`6`, `Esc`.
- Toolbar badge modes: off, on/off with the remaining pause time, or today's blocked percentage.
- Up to eight Pi-holes with a connection test and the Pi-hole's versions in the settings.
- Dark and light theme, following the browser by default.
- Settings export and import, reset.
- German and Brazilian Portuguese; the latter based on the locale contributed by @arraswi (#116).
- Shortcuts page listing the browser's shortcuts and a link to change them.

### Changed

- The extension talks to the Pi-hole v6 REST API through a client generated from Pi-hole's own OpenAPI
  specification.
- One API session per Pi-hole, kept alive by the status refresh and closed when you remove or change the Pi-hole.
  Version 4 opened a session per request and ran into Pi-hole's session limit (#103).
- All Pi-hole traffic runs in the background worker; the popup only shows state.
- Addresses are normalized: `/admin`, trailing slashes and the scheme are handled for you.
- Hotkey names are unchanged, so shortcuts you assigned keep working.

### Fixed

- The toolbar badge no longer disappears after the browser restarts the extension (#106; thanks to @arraswi for
  the analysis in #117).
- Errors from an unreachable Pi-hole are reported instead of crashing the status check (#118 by @arraswi described
  the failure in version 4).

### Removed

- Vue 2, Vuetify and webpack.
- The "disable update notification" and beta flags from the settings; the update hint is a small chip in the popup.
- Access to all websites. The extension requests each Pi-hole address instead.
