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
