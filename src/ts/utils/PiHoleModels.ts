/**
 * Interface for the PiHoleStatusApi
 */
export interface PiHoleApiStatus {
	status:PiHoleApiStatusEnum;
}

/**
 * Enum for the PiHoleStatusApi
 */
export enum PiHoleApiStatusEnum {
	enabled = 'enabled',
	disabled = 'disabled'
}
