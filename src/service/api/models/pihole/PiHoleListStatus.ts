export enum ApiListMode {
    whitelist = 'white',
    blacklist = 'black',
}

export interface PiHoleListStatus {
    success: boolean,
    message: string
}
