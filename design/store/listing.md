# Store listing texts

Copy from here into the Chrome Web Store, Edge Add-ons and AMO forms. Images are in this folder: five screenshots at
1280×800, `promo-tile-440x280.png` (Chrome small tile) and `marquee-1400x560.png`.

## Name

PiHole Browser Extension

## Summary (Chrome: 132 characters max)

Control your Pi-hole from the toolbar: pause blocking, allow or deny the current site, on every Pi-hole you own.

## Description

Pi-hole Switch puts your Pi-hole v6 into the browser toolbar.

• Pause blocking for 10 seconds, 5 minutes, an hour, as long as you like, or until you turn it back on. The popup counts down and the toolbar badge shows the state.
• See whether the site you are on is blocked, and by which list. Allow or deny it with one click, or allow it for 10 minutes and let the extension clean up afterwards.
• Several Pi-holes, one switch. Add up to eight; every action goes to all of them, and the popup shows the state of each one.
• Keyboard shortcuts and a right-click menu for toggling, allowing and denying.
• Toolbar badge with the state, the remaining pause time or today's blocked percentage.
• Dark and light theme following your browser. English, German and Brazilian Portuguese.
• Nothing leaves your browser except requests to the Pi-hole addresses you configure. No analytics, no accounts.

Requires Pi-hole v6 or newer. For Pi-hole v5 use version 4 of the extension.

Setup: click the icon, enter the address and password of your Pi-hole (an app password from Pi-hole › Settings › Web interface / API is recommended), and allow the browser to access that address when asked.

This is an independent project and not affiliated with the Pi-hole team.

## Beschreibung (Deutsch)

Pi-hole Switch bringt dein Pi-hole v6 in die Symbolleiste des Browsers.

• Blockierung für 10 Sekunden, 5 Minuten, eine Stunde, beliebig lange oder bis zum nächsten Einschalten pausieren. Das Popup zählt herunter, das Badge zeigt den Zustand.
• Sieh, ob die aktuelle Seite blockiert ist und durch welche Liste. Erlaube oder sperre sie mit einem Klick, oder erlaube sie für 10 Minuten und lass die Erweiterung danach aufräumen.
• Mehrere Pi-holes, ein Schalter. Bis zu acht Instanzen; jede Aktion geht an alle, das Popup zeigt den Zustand jeder einzelnen.
• Tastenkürzel und Kontextmenü zum Umschalten, Erlauben und Sperren.
• Badge mit Zustand, Restzeit der Pause oder dem heutigen Blockier-Anteil.
• Dunkles und helles Design, dem Browser folgend. Englisch, Deutsch und brasilianisches Portugiesisch.
• Nichts verlässt den Browser außer Anfragen an die Pi-hole-Adressen, die du einträgst. Keine Analyse, keine Konten.

Benötigt Pi-hole v6 oder neuer. Für Pi-hole v5 nutze Version 4 der Erweiterung.

Einrichtung: Symbol anklicken, Adresse und Passwort deines Pi-holes eingeben (ein App-Passwort aus Pi-hole › Einstellungen › Web interface / API ist empfehlenswert) und dem Browser den Zugriff auf diese Adresse erlauben, wenn er fragt.

Dies ist ein unabhängiges Projekt und steht in keiner Verbindung zum Pi-hole-Team.

## What's new in 5.0.0

Pi-hole Switch is new from the ground up for Pi-hole v6.

• The popup shows the state of every Pi-hole, counts down a pause, and tells you whether the current site is blocked and by which list.
• Allow a site for 10 minutes; the entry is removed again automatically.
• The toolbar badge is back, with the remaining pause time or today's blocked percentage if you like.
• One API session per Pi-hole, closed when you remove it, so Pi-hole's session limit is no longer exhausted.
• Dark and light theme, keyboard shortcuts inside the popup, settings export and import.

After the update the extension asks once for access to each Pi-hole address. It no longer requests access to all websites. Your Pi-holes and settings are carried over.

## Category and metadata

- Category: Productivity (Chrome), Privacy & Security (AMO)
- Homepage: https://github.com/badsgahhl/pihole-browser-extension
- Support: https://github.com/badsgahhl/pihole-browser-extension/issues
- Privacy policy: https://github.com/badsgahhl/pihole-browser-extension/blob/master/PRIVACY.md

## Permission justifications (Chrome Web Store)

- `storage`: Pi-hole addresses, passwords and preferences on the device.
- `alarms`: ending a pause and removing temporary allow entries on time, refreshing the state once a minute.
- `activeTab`: reading the current tab's host name when the user opens the popup or uses a shortcut, to show and change its status in Pi-hole.
- `contextMenus`: the right-click entries for toggling, allowing and denying.
- Optional host permissions: the extension requests access to each Pi-hole address the user saves, and to nothing else.
- Remote code: none. Data use: no user data is collected or transmitted to the developer.

## Privacy form (Edge Add-ons and Chrome Web Store)

### Single purpose

Control the user's own Pi-hole (v6) DNS filter from the browser toolbar: pause or resume blocking, see whether the current site is blocked, and add or remove it on the Pi-hole's allow or deny list. The extension talks only to the Pi-hole addresses the user enters in its settings.

### Permission justifications

- `storage`: Stores the Pi-hole addresses, names and passwords the user enters, the user's preferences (pause duration, badge mode, theme), the last known blocking state so the popup opens instantly, the API session per Pi-hole, and temporary allow entries the extension has to remove again. Everything stays in the browser's extension storage on the device; nothing is synced or sent to the developer.
- `alarms`: Timers the extension needs while its service worker is asleep: refreshing the blocking state once a minute for the toolbar badge, ending a timed pause on time, and removing a temporary allow entry when it expires.
- `activeTab`: Reads the host name of the active tab only when the user opens the popup, uses a keyboard shortcut or the context menu, so the popup can show whether that site is blocked by the Pi-hole and let the user allow or deny it. The host name is sent only to the user's own Pi-hole, cached for 30 seconds and not stored otherwise. No page content is read.
- `contextMenus`: Adds entries to the page's context menu to toggle Pi-hole blocking, allow or deny the current domain and open the settings, so the user can do this without opening the popup.
- Host permissions (optional, `http://*/*` and `https://*/*`): Access to a Pi-hole address is requested only when the user saves that address in the settings, one origin at a time, and released again when the address is removed. It is needed to send API requests to that Pi-hole. The extension never asks for access to all websites at install.

### Remote code

No. All code ships in the package; nothing is loaded from the network and nothing is evaluated from strings.

### Privacy policy URL

https://github.com/badsgahhl/pihole-browser-extension/blob/master/PRIVACY.md

### Data usage

- Authentication information: yes. The Pi-hole password (or app password) the user enters. Stored only in the browser's extension storage on the device and sent only to that Pi-hole to log in. Never transmitted to the developer.
- Web history: yes, in the narrowest sense. The host name of the current tab, read only when the user acts (popup, shortcut, context menu) and sent only to the user's own Pi-hole to look it up. Not recorded, not kept beyond a 30-second cache.
- Everything else: no. No personal, health, financial, communication, location, activity or page-content data.
- Certifications: data is not sold to third parties, not used or transferred for purposes unrelated to the extension's single purpose, and not used to determine creditworthiness or for lending purposes.
