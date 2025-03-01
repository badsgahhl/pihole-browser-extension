export type PiHoleDomains = {
  domains: Array<{
    domain: string
    unicode: string
    type: string
    kind: string
    comment: string
    groups: Array<number>
    enabled: boolean
    id: number
    date_added: number
    date_modified: number
  }>
  processed: {
    errors: Array<any>
    success: Array<{
      item: string
    }>
  }
  took: number
}
