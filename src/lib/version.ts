/** Pi-hole reports versions as `v6.4.2`; the UI shows the bare number. */
export function bareVersion(version: string | null | undefined): string {
  if (!version) return ''
  return version.replace(/^v(?=\d)/, '')
}

export interface VersionParts {
  core: string | null
  ftl: string | null
  web: string | null
  docker?: string | null
}

export interface VersionFormat {
  /** Include the Docker tag when Pi-hole runs in a container. Off for one-line summaries. */
  docker?: boolean
  separator?: string
}

/** Labelled version pairs in display order, skipping components Pi-hole did not report. */
export function versionLines(
  versions: VersionParts | null | undefined,
  { docker = true }: VersionFormat = {}
): string[] {
  if (!versions) return []
  const lines: string[] = []
  if (versions.core) lines.push(`Core ${bareVersion(versions.core)}`)
  if (versions.ftl) lines.push(`FTL ${bareVersion(versions.ftl)}`)
  if (versions.web) lines.push(`Web ${bareVersion(versions.web)}`)
  if (docker && versions.docker) lines.push(`Docker ${bareVersion(versions.docker)}`)
  return lines
}

/** "Core 6.4.2 · FTL 6.6.1 · Web 6.5" */
export function formatVersions(versions: VersionParts | null | undefined, format: VersionFormat = {}): string {
  return versionLines(versions, format).join(format.separator ?? ' · ')
}
