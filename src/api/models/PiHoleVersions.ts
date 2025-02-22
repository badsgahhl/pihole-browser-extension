export interface PiHoleVersions {
  core_update: boolean
  web_update: boolean
  FTL_update: boolean
  FTL_current: string
  FTL_latest: string
  web_current: string
  web_latest: string
  core_current: string
  core_latest: string
}

export type PiHoleVersionsV6 = {
  version: {
    core: {
      local: {
        branch: string
        version: string
        hash: string
      }
      remote: {
        version: string
        hash: string
      }
    }
    web: {
      local: {
        branch: string
        version: string
        hash: string
      }
      remote: {
        version: string
        hash: string
      }
    }
    ftl: {
      local: {
        branch: string
        version: string
        hash: string
        date: string
      }
      remote: {
        version: string
        hash: string
      }
    }
    docker: {
      local: string
      remote: string
    }
  }
  took: number
}
