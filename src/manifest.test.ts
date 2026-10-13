import { describe, expect, it } from 'vitest'
import type { ConfigEnv } from 'wxt'

import config from '../wxt.config'

async function manifestFor(browser: string) {
  const manifest = await config.manifest
  if (typeof manifest !== 'function') throw new Error('wxt.config.ts is expected to build the manifest per browser')
  const env: ConfigEnv = { browser, mode: 'production', command: 'build', manifestVersion: 3 }
  return manifest(env)
}

describe('Firefox manifest', () => {
  // Without a policy of its own, Firefox applies its MV3 default, whose upgrade-insecure-requests turns
  // requests to http:// Pi-holes into https:// (#123).
  it('declares an extension page policy without upgrade-insecure-requests', async () => {
    const policy = (await manifestFor('firefox')).content_security_policy?.extension_pages
    expect(policy).toBeTypeOf('string')
    expect(policy).toContain("script-src 'self'")
    expect(policy).not.toContain('upgrade-insecure-requests')
  })
})
