/** Manifest command names. The keys match the v4 names so existing user shortcuts survive. */
export const HOTKEYS = {
  toggle: 'hotkey-toggle-pihole',
  allow: 'hotkey-whitelist-current-domain',
  deny: 'hotkey-blacklist-current-domain',
  settings: 'hotkey-open-settings'
} as const

/** Display order for the shortcuts page; `commands.getAll()` returns them in no particular order. */
export const COMMAND_ORDER: readonly string[] = [HOTKEYS.toggle, HOTKEYS.allow, HOTKEYS.deny, HOTKEYS.settings]
