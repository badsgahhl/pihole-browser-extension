import { sendMessage } from './messaging'

/** Opens the options page, optionally at a router path like `/pi-holes/new`, and closes the popup. */
export async function openOptions(path?: string): Promise<void> {
  try {
    await sendMessage('openOptions', { path })
  } finally {
    window.close()
  }
}
