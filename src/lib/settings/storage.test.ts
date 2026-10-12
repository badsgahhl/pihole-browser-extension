import { describe, expect, it } from 'vitest'
import { fakeBrowser } from 'wxt/testing/fake-browser'

import { DEFAULT_SETTINGS } from './defaults'
import { readSettings } from './storage'

describe('readSettings', () => {
  it('returns the defaults on a fresh install', async () => {
    expect(await readSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('keeps the valid instances and fields when a stored value no longer validates', async () => {
    await fakeBrowser.storage.local.set({
      settings: {
        ...DEFAULT_SETTINGS,
        instances: [
          { id: 'a', name: 'A', url: 'http://pi.hole', password: 'x' },
          { id: 'b', name: 'B', url: 12, password: '' }
        ],
        badgeMode: 'percent',
        requestTimeoutMs: 5
      }
    })

    const settings = await readSettings()

    expect(settings.instances.map((instance) => instance.id)).toEqual(['a'])
    expect(settings.badgeMode).toBe('percent')
    expect(settings.requestTimeoutMs).toBe(DEFAULT_SETTINGS.requestTimeoutMs)
  })
})
