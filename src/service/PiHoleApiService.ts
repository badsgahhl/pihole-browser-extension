import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { PiHoleApiStatus } from '../api/models/PiHoleApiStatus'
import { PiHoleSettingsStorage, StorageService } from './StorageService'
import { PiHoleListStatus } from '../api/models/PiHoleListStatus'
import { PiHoleVersionsV6 } from '../api/models/PiHoleVersions'
import ApiListMode from '../api/enum/ApiListMode'
import ApiList from '../api/enum/ApiList'
import PiHoleApiStatusEnum from '../api/enum/PiHoleApiStatusEnum'
import { PiHoleAuth } from '../api/models/PiHoleAuth'

export default class PiHoleApiService {
  public static async getPiHoleStatusCombined(): Promise<PiHoleApiStatusEnum> {
    return new Promise<PiHoleApiStatusEnum>(resolve => {
      this.getPiHoleStatus()
        .then(results => {
          for (const result of results) {
            const resultData = result.data
            // If any PiHole is offline or has an error we use its status
            if (
              resultData.blocking === PiHoleApiStatusEnum.error ||
              resultData.blocking === PiHoleApiStatusEnum.disabled
            ) {
              resolve(resultData.blocking)
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

      url.searchParams.append('status', '')
      promiseArray.push(
        this.getAxiosInstance(piHole.pi_uri_base, piHole.api_key).get<
          PiHoleApiStatus
        >('/dns/blocking')
      )
    }

    return Promise.all(promiseArray)
  }

  public static async getPiHoleVersion(
    piHole: PiHoleSettingsStorage
  ): Promise<AxiosResponse<PiHoleVersionsV6>> {
    if (
      typeof piHole.pi_uri_base === 'undefined' ||
      typeof piHole.api_key === 'undefined'
    ) {
      return Promise.reject('Some PiHoleSettings are undefined.')
    }

    return this.getAxiosInstance(piHole.pi_uri_base, piHole.api_key).get<
      PiHoleVersionsV6
    >('/info/version')
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

      let blocking
      if (mode === PiHoleApiStatusEnum.disabled) {
        blocking = false
      } else if (mode === PiHoleApiStatusEnum.enabled) {
        blocking = true
      } else {
        return Promise.reject(`Mode ${mode} not allowed for this function.`)
      }

      promiseArray.push(
        this.getAxiosInstance(piHole.pi_uri_base, piHole.api_key).post<
          PiHoleApiStatus
        >('/dns/blocking', {
          blocking,
          timer: time === 0 ? null : time
        })
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

      const addPromise = () =>
        this.getAxiosInstance(piHole.pi_uri_base!, piHole.api_key).post(
          `/domains/${list}/exact`,
          {
            domain,
            comment: 'From PiHole Extension',
            groups: [0],
            enabled: true
          }
        )
      const subPromise = () =>
        this.getAxiosInstance(piHole.pi_uri_base!, piHole.api_key)
          .delete(`/domains/${list}/exact/${domain}`)
          .catch(
            // Sub can fail if the domain is not in the list
            // We can ignore this error
            reason => {
              console.warn(reason)
              return reason
            }
          )

      promiseArray.push(mode === ApiListMode.add ? addPromise() : subPromise())
    }

    return Promise.all(promiseArray)
  }

  private static getAxiosConfig(): AxiosRequestConfig {
    return {
      transformResponse: data => JSON.parse(data)
    }
  }

  private static getPiHoleBaseUrl(domain: string, apiKey?: string): URL {
    // We only need the domain. We add the api.php later
    const baseUrl = new URL(domain)

    let correctApiKey
    if (typeof apiKey === 'undefined' || apiKey.length < 1) {
      correctApiKey = ''
    } else {
      correctApiKey = apiKey
    }
    baseUrl.searchParams.append('auth', correctApiKey)
    return baseUrl
  }

  private static getAxiosInstance(
    domain: string,
    apiKey?: string
  ): AxiosInstance {
    const apiUrl = new URL('/api', new URL(domain))

    const instance = axios.create({
      baseURL: apiUrl.toString(),
      transformResponse: data => JSON.parse(data)
    })

    const acquireSid = async () => {
      const axiosInstance = axios.create({
        baseURL: apiUrl.toString()
      })

      const auth = await axiosInstance.post<PiHoleAuth>('/auth', {
        password: apiKey
      })

      return auth.data.session
    }

    instance.interceptors.request.use(async config => {
      // No API key, no need to add it to the headers
      if (!apiKey) {
        return config
      }

      const sid = await StorageService.getSid(domain)
      console.log('got sid', sid)
      if (sid) {
        console.log('Using existing session', sid)
        // eslint-disable-next-line no-param-reassign
        config.headers['X-FTL-SID'] = sid
        return config
      }

      const session = await acquireSid()
      console.log('Acquired new session', session)
      await StorageService.saveSid(domain, session.sid, session.validity)
      // eslint-disable-next-line no-param-reassign
      config.headers['X-FTL-SID'] = session.sid

      return config
    })

    // Response interceptor to handle session expiration
    instance.interceptors.response.use(undefined, async error => {
      if (error.response.status === 403) {
        console.log('Session expired, acquiring new session')
        const session = await acquireSid()
        await StorageService.saveSid(domain, session.sid, session.validity)
        // eslint-disable-next-line no-param-reassign
        error.config.headers['X-FTL-SID'] = session.sid
        return axios.request(error.config)
      }
      return Promise.reject(error)
    })

    return instance
  }
}
