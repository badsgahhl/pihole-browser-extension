import PiHoleApiStatusEnum from '../enum/PiHoleApiStatusEnum'

export interface PiHoleApiStatus {
  blocking: PiHoleApiStatusEnum
  timer?: null | number
}
