# Privacy policy

PiHole Browser Extension ("Pi-hole Switch") is a browser extension by Pascal Glaser that controls Pi-hole instances
you configure. This policy describes what it does with data. Last updated 12 October 2026.

## What the extension collects

Nothing. There is no analytics, no telemetry, no crash reporting, no advertising, and no server operated by the
author that the extension talks to.

## Where data goes

The extension sends requests only to the Pi-hole addresses you enter in its settings, under the path `/api` of each
address. These requests log in with the password you provided, read and change the blocking state, read version and
statistics information, look up the current site in your Pi-hole's lists, and add or remove entries you asked for.

## What is stored, and where

Everything is stored in the browser's extension storage on your device. Nothing is synced or sent elsewhere.

- The addresses, names and passwords of your Pi-holes. Passwords are needed to log in and are stored as you entered
  them. They are removed when you remove the Pi-hole or reset the extension.
- Your preferences (pause duration, badge mode, theme and so on).
- The last known state of your Pi-holes, so the popup opens without waiting.
- The API session id of each Pi-hole, in session storage that the browser clears when it closes. The extension logs
  out of a Pi-hole when you remove or change it.
- Temporary allow entries it created, so it can remove them again.

The settings export you can trigger yourself contains the passwords. You decide where that file goes.

## The current site

To show whether the site you are on is blocked, and to allow or deny it, the extension reads the address of the
active tab. It does this only when you open the popup, use a shortcut, or use the context menu, through the
browser's `activeTab` permission. Only the host name (for example `ads.example.com`) is sent, and only to your
Pi-holes. The answer is cached for 30 seconds and not stored beyond that.

## Permissions

- `storage` and `alarms`: settings, state and the timers that end a pause or remove a temporary allow entry.
- `activeTab` and `contextMenus`: the current site and the right-click menu.
- Access to each Pi-hole address, requested when you save it and released when you remove it. The extension never
  asks for access to all websites.

On Firefox the extension declares that it collects no data (`data_collection_permissions: none`).

## Uninstalling

When you remove the extension, the browser may open a short feedback form hosted on Google Forms. It is optional;
nothing is sent unless you fill it in and submit it. Google's privacy policy applies to that form.

## Contact

Questions and reports: https://github.com/badsgahhl/pihole-browser-extension/issues
