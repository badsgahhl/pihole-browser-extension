import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { PiHoleApiStatus } from '../api/models/PiHoleApiStatus'
import { PiHoleSettingsStorage, StorageService } from './StorageService'
import { PiHoleListStatus } from '../api/models/PiHoleListStatus'
import { PiHoleVersions } from '../api/models/PiHoleVersions'
import ApiListMode from '../api/enum/ApiListMode'
import ApiList from '../api/enum/ApiList'
import PiHoleApiStatusEnum from '../api/enum/PiHoleApiStatusEnum'

export default class PiHoleApiService {
  public static async getPiHoleStatusCombined(): Promise<PiHoleApiStatusEnum> {
    return new Promise<PiHoleApiStatusEnum>(resolve => {
      this.getPiHoleStatus()
        .then(results => {
          for (const result of results) {
            const resultData = result.data
            // If any PiHole is offline or has an error we use its status
            if (
              resultData.status === PiHoleApiStatusEnum.error ||
              resultData.status === PiHoleApiStatusEnum.disabled
            ) {
              resolve(resultData.status)
            }
          }
          resolve(PiHoleApiStatusEnum.enabled)
        })
        .catch(reason => {
          console.warn(reason)
          resolve(PiHoleApiStatusEnum.error)
        })
    })
  }

  public static async getPiHoleStatus(): Promise<
    AxiosResponse<PiHoleApiStatus>[]
  > {
    const piHoleSettingsArray = await StorageService.getPiHoleSettingsArray()
    if (typeof piHoleSettingsArray === 'undefined') {
      return Promise.reject('PiHoleSettings empty')
    }

    const promiseArray = new Array<Promise<AxiosResponse<PiHoleApiStatus>>>()

    for (const piHole of piHoleSettingsArray) {
      if (
        typeof piHole.pi_uri_base === 'undefined' ||
        typeof piHole.api_key === 'undefined'
      ) {
        return Promise.reject('Some PiHoleSettings are undefined.')
      }

      const url = this.getPiHoleBaseUrl(piHole.pi_uri_base, piHole.api_key)

      // url.searchParams.append('status', '')
      promiseArray.push(
        axios.get<PiHoleApiStatus>(url.href, this.getAxiosConfig())
      )
    }

    return Promise.all(promiseArray)
  }

  public static async getPiHoleVersions(): Promise<
    AxiosResponse<PiHoleVersions>[]
  > {
    const piHoleSettingsArray = await StorageService.getPiHoleSettingsArray()
    if (typeof piHoleSettingsArray === 'undefined') {
      return Promise.reject('PiHoleSettings empty')
    }
    const promiseArray = new Array<Promise<AxiosResponse<PiHoleVersions>>>()

    for (const piHole of piHoleSettingsArray) {
      promiseArray.push(this.getPiHoleVersion(piHole))
    }

    return Promise.all(promiseArray)
  }

  public static async getPiHoleVersion(
    piHole: PiHoleSettingsStorage
  ): Promise<AxiosResponse<PiHoleVersions>> {
    if (
      typeof piHole.pi_uri_base === 'undefined' ||
      typeof piHole.api_key === 'undefined'
    ) {
      return Promise.reject('Some PiHoleSettings are undefined.')
    }
    const url = this.getPiHoleBaseUrl(piHole.pi_uri_base, piHole.api_key)

    url.searchParams.append('versions', '')
    return axios.get<PiHoleVersions>(url.href, this.getAxiosConfig())
  }

  public static async changePiHoleStatus(
    mode: PiHoleApiStatusEnum,
    time: number
  ): Promise<AxiosResponse<PiHoleApiStatus>[]> {
    const piHoleSettingsArray = await StorageService.getPiHoleSettingsArray()
    if (typeof piHoleSettingsArray === 'undefined') {
      return Promise.reject('PiHoleSettings empty')
    }

    if (time < 0) {
      return Promise.reject(`Disable time smaller than allowed:${time}`)
    }

    const promiseArray = new Array<Promise<AxiosResponse<PiHoleApiStatus>>>()

    for (const piHole of piHoleSettingsArray) {
      if (
        typeof piHole.pi_uri_base === 'undefined' ||
        typeof piHole.api_key === 'undefined'
      ) {
        return Promise.reject('Some PiHoleSettings are undefined.')
      }

      const url = this.getPiHoleBaseUrl(piHole.pi_uri_base, piHole.api_key)

      if (mode === PiHoleApiStatusEnum.disabled) {
        url.searchParams.append('disable', time.toString())
      } else if (mode === PiHoleApiStatusEnum.enabled) {
        url.searchParams.append('enable', '')
      } else {
        return Promise.reject(`Mode ${mode} not allowed for this function.`)
      }

      promiseArray.push(
        axios.get<PiHoleApiStatus>(url.href, this.getAxiosConfig())
      )
    }

    return Promise.all(promiseArray)
  }

  public static async addDomainToList(
    list: ApiList,
    domain: string
  ): Promise<AxiosResponse<PiHoleListStatus>[]> {
    return this.changeDomainOnList(list, ApiListMode.add, domain)
  }

  public static async subDomainFromList(
    list: ApiList,
    domain: string
  ): Promise<AxiosResponse<PiHoleListStatus>[]> {
    return this.changeDomainOnList(list, ApiListMode.sub, domain)
  }

  private static async changeDomainOnList(
    list: ApiList,
    mode: ApiListMode,
    domain: string
  ): Promise<AxiosResponse<PiHoleListStatus>[]> {
    const piHoleSettingsArray = await StorageService.getPiHoleSettingsArray()

    if (typeof piHoleSettingsArray === 'undefined') {
      return Promise.reject('PiHoleSettings empty')
    }

    if (domain.length < 1) {
      return Promise.reject("Domain can't be empty")
    }

    const promiseArray = new Array<Promise<AxiosResponse<PiHoleListStatus>>>()

    for (const piHole of piHoleSettingsArray) {
      if (
        typeof piHole.pi_uri_base === 'undefined' ||
        typeof piHole.api_key === 'undefined'
      ) {
        return Promise.reject('Some PiHoleSettings are undefined.')
      }
      const url = this.getPiHoleBaseUrl(piHole.pi_uri_base, piHole.api_key)
      url.searchParams.append('list', list)
      url.searchParams.append(mode, domain)
      promiseArray.push(
        axios.get<PiHoleListStatus>(url.href, this.getAxiosConfig())
      )
    }

    return Promise.all(promiseArray)
  }

  private static getAxiosConfig(): AxiosRequestConfig {
    return {
      transformResponse: data => JSON.parse(data)
    }
  }

  private static getPiHoleBaseUrl(domain: string, apiKey?: string): URL {
    let domainPrepared = domain
    if (domain.slice(-1) !== '/') {
      domainPrepared += '/'
    }
    const baseUrl = new URL('api.php', domainPrepared)

    let correctApiKey
    if (typeof apiKey === 'undefined' || apiKey.length < 1) {
      correctApiKey = ''
    } else {
      correctApiKey = apiKey
    }
    baseUrl.searchParams.append('auth', correctApiKey)
    return baseUrl
  }
}
