// Runs before the first paint of every extension page. Applies the stored theme so the popup
// does not flash light before Vue mounts. Lives in its own file because MV3 forbids inline scripts.
;(function () {
  try {
    var stored = localStorage.getItem('pihole-switch:theme')
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    var dark = stored === 'dark' || ((stored === null || stored === 'system') && prefersDark)
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
  } catch (_) {
    // Storage can be unavailable; the composable applies the theme once Vue runs.
  }
})()
