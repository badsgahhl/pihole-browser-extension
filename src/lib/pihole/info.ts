import { getBlocking, getMessagesCount, getMetricsSummary, getVersion } from '@/lib/api/pihole'
import type { BlockingState, InstanceStats, InstanceVersions } from '@/lib/state'

import type { InstanceContext } from './instances'
import { withSession } from './session'

export interface BlockingInfo {
  blocking: BlockingState
  /** Seconds until the opposite mode kicks in, `null` when permanent. */
  timer: number | null
}

export async function fetchBlocking(ctx: InstanceContext): Promise<BlockingInfo> {
  const data = await withSession(ctx, (o) => getBlocking({ ...o }))
  return { blocking: data.blocking ?? 'unknown', timer: typeof data.timer === 'number' ? data.timer : null }
}

/** `v6.4.2` -> [6, 4, 2]; anything unparseable -> []. */
function versionParts(version: string | null | undefined): number[] {
  if (!version) return []
  const match = version.match(/(\d+)\.(\d+)(?:\.(\d+))?/)
  if (!match) return []
  return [Number(match[1]), Number(match[2]), Number(match[3] ?? 0)]
}

/** True when `remote` describes a newer release than `local`. Unknown versions never count as updates. */
export function isNewer(remote: string | null | undefined, local: string | null | undefined): boolean {
  const a = versionParts(local)
  const b = versionParts(remote)
  if (a.length === 0 || b.length === 0) return false
  for (let i = 0; i < 3; i++) {
    if ((b[i] ?? 0) > (a[i] ?? 0)) return true
    if ((b[i] ?? 0) < (a[i] ?? 0)) return false
  }
  return false
}

export async function fetchVersions(ctx: InstanceContext): Promise<InstanceVersions> {
  const data = await withSession(ctx, (o) => getVersion({ ...o }))
  const v = data.version ?? {}
  const core = v.core?.local?.version ?? null
  const web = v.web?.local?.version ?? null
  const ftl = v.ftl?.local?.version ?? null
  const docker = v.docker?.local ?? null
  const updateAvailable =
    isNewer(v.core?.remote?.version, core) ||
    isNewer(v.web?.remote?.version, web) ||
    isNewer(v.ftl?.remote?.version, ftl) ||
    (docker !== null && isNewer(v.docker?.remote, docker))
  return { core, web, ftl, docker, updateAvailable }
}

export async function fetchMessagesCount(ctx: InstanceContext): Promise<number> {
  const data = await withSession(ctx, (o) => getMessagesCount({ ...o }))
  return data.count ?? 0
}

export async function fetchStats(ctx: InstanceContext): Promise<InstanceStats> {
  const data = await withSession(ctx, (o) => getMetricsSummary({ ...o }))
  return {
    queries: data.queries?.total ?? 0,
    blocked: data.queries?.blocked ?? 0,
    percentBlocked: data.queries?.percent_blocked ?? 0,
    clients: data.clients?.active ?? 0
  }
}
