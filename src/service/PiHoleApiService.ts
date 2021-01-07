import {PiHoleApiStatus} from "../api/models/PiHoleApiStatus";
import axios, {AxiosRequestConfig, AxiosResponse} from "axios";
import {PiHoleSettingsDefaults, StorageService} from "./StorageService";
import {PiHoleListStatus} from "../api/models/PiHoleListStatus";
import {PiHoleVersions} from "../api/models/PiHoleVersions";
import {ApiListMode} from "../api/enum/ApiListMode";
import {ApiList} from "../api/enum/ApiList";
import {PiHoleApiStatusEnum} from "../api/enum/PiHoleApiStatusEnum";

export default class PiHoleApiService {

    public static async getPiHoleStatusCombined(): Promise<PiHoleApiStatusEnum> {
        return new Promise<PiHoleApiStatusEnum>(resolve => {
            this.getPiHoleStatus().then(results => {
                for (const result of results) {
                    const resultData = result.data;
                    // If any PiHole is offline or has an error we use its status
                    if (resultData.status === PiHoleApiStatusEnum.error || resultData.status === PiHoleApiStatusEnum.disabled) {
                        resolve(resultData.status);
                    }
                }
                resolve(PiHoleApiStatusEnum.enabled);
            }).catch(reason => {
                console.warn(reason);
                resolve(PiHoleApiStatusEnum.error);
            });
        });
    }

    public static async getPiHoleStatus(): Promise<AxiosResponse<PiHoleApiStatus>[]> {
        const piHoleSettingsArray = (await StorageService.getPiHoleSettingsArray());
        if (typeof piHoleSettingsArray === "undefined") {
            return Promise.reject('PiHoleSettings empty');
        }

        const promiseArray = new Array<Promise<AxiosResponse<PiHoleApiStatus>>>();

        for (const piHole of piHoleSettingsArray) {
            if (typeof piHole.pi_uri_base === "undefined" || typeof piHole.api_key === "undefined") {
                return Promise.reject('Some PiHoleSettings are undefined.');
            }
            promiseArray.push(axios.get<PiHoleApiStatus>(`${this.getPiHoleBaseUrl(piHole.pi_uri_base, piHole.api_key)}&status`, this.getAxiosConfig()))
        }

        return Promise.all(promiseArray);

    }

    public static async getPiHoleVersions(): Promise<AxiosResponse<PiHoleVersions>[]> {
        const piHoleSettingsArray = (await StorageService.getPiHoleSettingsArray());
        if (typeof piHoleSettingsArray === "undefined") {
            return Promise.reject('PiHoleSettings empty');
        }
        const promiseArray = new Array<Promise<AxiosResponse<PiHoleVersions>>>();

        for (const piHole of piHoleSettingsArray) {
            if (typeof piHole.pi_uri_base === "undefined" || typeof piHole.api_key === "undefined") {
                return Promise.reject('Some PiHoleSettings are undefined.');
            }
            promiseArray.push(axios.get<PiHoleVersions>(`${this.getPiHoleBaseUrl(piHole.pi_uri_base, piHole.api_key)}&versions`, this.getAxiosConfig()))
        }

        return Promise.all(promiseArray);
    }

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
        const promiseArray = new Array<Promise<AxiosResponse<PiHoleApiStatus>>>();

        for (const piHole of piHoleSettingsArray) {
            if (typeof piHole.pi_uri_base === "undefined" || typeof piHole.api_key === "undefined") {
                return Promise.reject('Some PiHoleSettings are undefined.');
            }

            promiseArray.push(axios.get<PiHoleApiStatus>(`${this.getPiHoleBaseUrl(piHole.pi_uri_base, piHole.api_key)}&${urlAction}`, this.getAxiosConfig()))
        }

        return Promise.all(promiseArray);
    }

    public static async addDomainToList(list: ApiList, domain: string): Promise<AxiosResponse<PiHoleListStatus>[]> {
        return this.changeDomainOnList(list, ApiListMode.add, domain);
    }

    public static async subDomainFromList(list: ApiList, domain: string): Promise<AxiosResponse<PiHoleListStatus>[]> {
        return this.changeDomainOnList(list, ApiListMode.sub, domain);
    }

    private static async changeDomainOnList(list: ApiList, mode: ApiListMode, domain: string): Promise<AxiosResponse<PiHoleListStatus>[]> {
        const piHoleSettingsArray = (await StorageService.getPiHoleSettingsArray());

        if (typeof piHoleSettingsArray === "undefined") {
            return Promise.reject('PiHoleSettings empty');
        }

        if (domain.length < 1) {
            return Promise.reject('Domain can\'t be empty');
        }

        const promiseArray = new Array<Promise<AxiosResponse<PiHoleListStatus>>>();

        for (const piHole of piHoleSettingsArray) {
            if (typeof piHole.pi_uri_base === "undefined" || typeof piHole.api_key === "undefined") {
                return Promise.reject('Some PiHoleSettings are undefined.');
            }

            promiseArray.push(axios.get<PiHoleListStatus>(`${this.getPiHoleBaseUrl(piHole.pi_uri_base, piHole.api_key)}&list=${list}&${mode}=${domain}`, this.getAxiosConfig()));
        }

        return Promise.all(promiseArray);
    }

    private static getAxiosConfig(): AxiosRequestConfig {
        return {
            transformResponse: data => JSON.parse(data)
        }
    }

    private static getPiHoleBaseUrl(url: string, apiKey?: string) {
        let baseUrl = new URL('api.php?', url).toString();
        if (typeof apiKey !== "undefined" && apiKey.length > 0) {
            baseUrl = `${baseUrl}auth=${apiKey}`;
        }
        return baseUrl;
    }
}