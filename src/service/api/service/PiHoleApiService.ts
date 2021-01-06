import {PiHoleApiStatus, PiHoleApiStatusEnum} from "../models/pihole/PiHoleApiStatus";
import axios, {AxiosResponse} from "axios";
import {PiHoleSettingsDefaults, StorageService} from "../../browser/StorageService";

export default class PiHoleApiService {

    public static async changePiHoleStatus(mode: PiHoleApiStatusEnum, time: number): Promise<AxiosResponse<PiHoleApiStatus>[]> {
        const piHoleSettingsArray = (await StorageService.getPiHoleSettingsArray());
        if (typeof piHoleSettingsArray === "undefined") {
            return Promise.reject('PiHoleSettings empty');
        }

        if (time < PiHoleSettingsDefaults.default_disable_time) {
            return Promise.reject('Disable time smaller than allowed:' + time);
        }

        let urlAction: string;
        if (mode === PiHoleApiStatusEnum.disabled) {
            urlAction = `disable=${time}`;
        } else if (mode === PiHoleApiStatusEnum.enabled) {
            urlAction = 'enable';
        } else {
            return Promise.reject('Mode ' + mode + ' not allowed for this function.');
        }
        const promiseArray: Array<Promise<AxiosResponse<PiHoleApiStatus>>> = new Array<Promise<AxiosResponse<PiHoleApiStatus>>>();

        for (const piHole of piHoleSettingsArray) {
            if (typeof piHole.pi_uri_base === "undefined" || typeof piHole.api_key === "undefined") {
                return Promise.reject('Some PiHoleSettings are undefined.');
            }

            promiseArray.push(axios.get<PiHoleApiStatus>(`${this.getPiHoleBaseUrl(piHole.pi_uri_base, piHole.api_key)}&${urlAction}`))
        }

        return Promise.all(promiseArray);
    }

    private static getPiHoleBaseUrl(url: string, apiKey?: string) {
        let baseUrl = new URL('api.php?', url).toString();
        if (typeof apiKey !== "undefined" && apiKey.length > 0) {
            baseUrl = `${baseUrl}auth=${apiKey}`;
        }
        return baseUrl;
    }
}