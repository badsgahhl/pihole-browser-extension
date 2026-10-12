// Regenerates the typed Pi-hole API client in src/lib/api/pihole from the vendored FTL OpenAPI spec.
//
//   node scripts/generate-api.ts            bundle api-spec/upstream and regenerate the client
//   node scripts/generate-api.ts --fetch    first download the spec files for the tag in api-spec/FTL_VERSION
//
// Runs on Node 24 without a build step, so this file uses only erasable TypeScript syntax.
import { execSync } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(import.meta.url), '../..')
const specDir = join(root, 'api-spec')
const upstreamDir = join(specDir, 'upstream')
const bundledPath = join(specDir, 'pihole-api.bundled.json')
const tag = readFileSync(join(specDir, 'FTL_VERSION'), 'utf8').trim()

interface GithubEntry {
  name: string
  type: string
  download_url: string
}

async function downloadSpec(ref: string): Promise<void> {
  const url = `https://api.github.com/repos/pi-hole/FTL/contents/src/api/docs/content/specs?ref=${encodeURIComponent(ref)}`
  const listing = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } })
  if (!listing.ok) throw new Error(`GitHub listing failed: HTTP ${listing.status} for ${url}`)
  const entries = ((await listing.json()) as GithubEntry[]).filter((e) => e.type === 'file' && e.name.endsWith('.yaml'))
  if (entries.length === 0) throw new Error(`No spec files found at ${ref}`)

  rmSync(upstreamDir, { recursive: true, force: true })
  mkdirSync(upstreamDir, { recursive: true })
  for (const entry of entries) {
    const res = await fetch(entry.download_url)
    if (!res.ok) throw new Error(`Download failed: HTTP ${res.status} for ${entry.name}`)
    writeFileSync(join(upstreamDir, entry.name), await res.text())
  }
  console.log(`Fetched ${entries.length} spec files from pi-hole/FTL at ${ref}`)
}

function bundle(): void {
  // The upstream spec is split over many files with cross-file $refs. @hey-api/openapi-ts crashes on
  // that layout, so Redocly bundles it into one document first.
  execSync(`pnpm exec redocly bundle "${join(upstreamDir, 'main.yaml')}" --ext json -o "${bundledPath}"`, {
    cwd: root,
    stdio: 'inherit'
  })
}

function patchOperationIds(): void {
  const spec = JSON.parse(readFileSync(bundledPath, 'utf8')) as {
    paths?: Record<string, Record<string, { operationId?: string }>>
  }
  const logout = spec.paths?.['/auth']?.delete
  if (!logout) throw new Error('DELETE /auth is missing from the bundled spec')
  if (logout.operationId !== 'delete_groups') {
    throw new Error(
      `DELETE /auth carries operationId "${logout.operationId}". This script renames the upstream ` +
        `"delete_groups" to "logout"; upstream seems to have changed, so review and remove this patch.`
    )
  }
  logout.operationId = 'logout'
  writeFileSync(bundledPath, JSON.stringify(spec, null, 2) + '\n')
}

function generateClient(): void {
  execSync('pnpm exec openapi-ts', { cwd: root, stdio: 'inherit' })
}

if (process.argv.includes('--fetch')) await downloadSpec(tag)
bundle()
patchOperationIds()
generateClient()
console.log(`Generated src/lib/api/pihole from FTL ${tag}`)
