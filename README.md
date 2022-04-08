# PiHole Browser Extension ![t](https://github.com/badsgahhl/pihole-browser-extension/blob/master/icon/icon-48.png?raw=true)

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/ngoafjpapneaopfkpboebcahajopcifi)](https://chrome.google.com/webstore/detail/switch-for-pihole/ngoafjpapneaopfkpboebcahajopcifi)
[![Mozilla Add-on](https://img.shields.io/amo/v/pihole-browser-extension)](https://addons.mozilla.org/firefox/addon/pihole-browser-extension/)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/users/ngoafjpapneaopfkpboebcahajopcifi?label=chrome%20users)](https://chrome.google.com/webstore/detail/switch-for-pihole/ngoafjpapneaopfkpboebcahajopcifi)
[![Mozilla Add-on](https://img.shields.io/amo/users/pihole-browser-extension?color=green&label=mozilla%20users)](https://addons.mozilla.org/firefox/addon/pihole-browser-extension/)
![GitHub](https://img.shields.io/github/license/badsgahhl/pihole-browser-extension)
<br><br>
The PiHole Browser Extension is a small browser extension for Chrome and Firefox. It's written with Vue and Typescript.
With this extension you can control your PiHole remotely (e.g. Turning it on/off, black/white listing current tab, etc.)
.

<br>

[![chrome](https://wd.imgix.net/image/BrQidfK9jaQyIHwdw91aVpkPiib2/RQMv2HZ0v6NKfFn7XCeU.png?auto=format&w=228)](https://chrome.google.com/webstore/detail/switch-for-pihole/ngoafjpapneaopfkpboebcahajopcifi)
<a href="https://addons.mozilla.org/firefox/addon/pihole-browser-extension/" target="_blank">
  <img src="https://design.firefox.com/product-identity/firefox/firefox-horizontal-lockup/firefox-logo-horizontal-lockup.png" alt="Firefox Logo" width="155"/>
</a>  

### Features:

- Disable your PiHole(s) easily with one click
- Individual configuration for multiple PiHoles
- White-/Blacklist your current tabs url with one click
- Shortcuts - Use features quickly with a hotkey shortcut or pages context menu
- Connection checker within the settings

### How to use:

1. Open the popup by clicking the "Raspberry" Icon in the top navigation of your browser
2. Click on the setting wheel in the top right corner
3. Enter your host address (including http:// or https:// and the directory.
4. Go to your PiHole settings. Click "Api/Web interface" and then on "Show Api token" at the bottom of your screen.
5. Copy the api key into the settings

### Troubleshooting

#### Status / Slider are not working

Please check that you used the correct host address. Use the address where you can see your dashboard page (statistics
board). For example if your pihole is located at http://192.168.178.2, but you can see your dashboard/admin page
at http://192.168.178.2/admin then don't forget to add /admin to the address. The connection checker will show you if
your given address is valid.

#### Error after clicking the Slider (was "on" before)

This indicates that your API key is probably wrong. In the version >2.0.6 the options will show you if your key is
wrong. Check that you copied the key correctly and that there are no whitespaces, etc. in it.

#### Black- / Whitelisting domains

The extension is able to black and whitelist the current tabs url. This feature requires PiHole v5.1+.

### This is not an official PiHole application.

Please use the issue templates in **this** repository for bugs. The main PiHole project **is not responsible** for any
malfunction that is caused by the use of the extension!
