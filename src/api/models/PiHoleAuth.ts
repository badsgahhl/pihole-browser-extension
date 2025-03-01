export interface PiHoleAuth {
  session: {
    valid: boolean
    totp: boolean
    sid: string
    csrf: string
    validity: number
    message: string
  }
  took: number
}
