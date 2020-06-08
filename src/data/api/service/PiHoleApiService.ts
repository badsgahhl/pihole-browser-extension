import {PiHoleVersions} from "../models/pihole/PiHoleVersions";
import {ApiRequestMethodEnum, PiHoleApiRequest} from "./PiHoleApiRequest";
import {PiHoleSettingsStorage, StorageService} from "../../storage/StorageService";
import {PiHoleApiStatus, PiHoleApiStatusEnum} from "../models/pihole/PiHoleApiStatus";
import {ApiJsonErrorMessages} from "../errors/ApiErrorMessages";
import {ApiListMode} from "../models/pihole/PiHoleListStatus";

export module PiHoleApiService
{
	/**
	 * Returns an array of PiHoleVersions for each pihole
	 */
	export async function get_pi_hole_version(): Promise<PiHoleVersions[]>
	{
		const storage = (await StorageService.get_pi_hole_settings_array());
		if (typeof storage === "undefined")
		{
			return [];
		}
		let promise_array = [];
		for (const pi_hole_setting of storage)
		{
			promise_array.push(new Promise(resolve => pi_hole_version_promise_function(pi_hole_setting, resolve)));
		}

		return await Promise.all(promise_array);
	}

	/**
	 * Promise function for PiHoleApiService::get_pi_hole_version
	 * @param pi_hole_setting
	 * @param resolve
	 */
	function pi_hole_version_promise_function(pi_hole_setting: PiHoleSettingsStorage, resolve: (value) => void): void
	{
		const request = new PiHoleApiRequest(pi_hole_setting.pi_uri_base, pi_hole_setting.api_key);

		request.add_get_param('versions');

		request.onreadystatechange = function() {
			if (this.readyState === 4 && this.status === 200)
			{
				let versions: PiHoleVersions = {
					FTL_latest: 0,
					core_latest: 0,
					web_latest: 0,
					FTL_current: 0, core_current: 0, web_current: 0
				};

				try
				{
					const data = JSON.parse(this.response);
					Object.entries(data).forEach(([key, value]) => {
						if (key in versions)
						{
							let version: number | string = String(value).replace('v', '');
							if (version === 'Dev')
							{
								version = -1;
							}
							else
							{
								version = Number(version);
							}
							versions[key] = version;
						}
					});
					resolve(versions);

				}
				catch (e)
				{
					console.log(e);
				}
			}
		}
		request.send().then();
	}

	/**
	 * Sends a request to list a domain on all pi-holes
	 * @param domain
	 * @param mode
	 */
	export async function list_domain(domain: string, mode: ApiListMode): Promise<string[]>
	{
		const request_promises = [];
		const storage = (await StorageService.get_pi_hole_settings_array());

		for (const pi_hole of storage)
		{
			request_promises.push(new Promise(resolve => list_domain_promise_function(pi_hole, mode, domain, resolve)));
		}

		return await Promise.all(request_promises);
	}

	/**
	 * Promise function for PiHoleApiService::list_domain
	 * @param pi_hole_setting
	 * @param mode
	 * @param domain
	 * @param resolve
	 */
	function list_domain_promise_function(pi_hole_setting: PiHoleSettingsStorage, mode: ApiListMode, domain: string, resolve: (value) => void): void
	{
		const api_request = new PiHoleApiRequest(pi_hole_setting.pi_uri_base, pi_hole_setting.api_key);

		api_request.method = ApiRequestMethodEnum.POST;
		api_request.add_get_param('list', mode);
		api_request.add_get_param('add', domain);
		api_request.add_post_param('comment', 'Added via PiHole Remote Extension');

		api_request.onreadystatechange = function() {
			if (this.readyState === 4 && this.status === 200)
			{
				const response: string = this.response;

				resolve(response);
			}
		}

		api_request.send().then();
	}

	/**
	 * Changes the status of all pi-hole to the given status
	 * @param status
	 * @param time
	 * @param successCallback
	 * @param errorCallback
	 */
	export async function change_pi_hole_status(status: PiHoleApiStatusEnum, time: number, successCallback: (data: PiHoleApiStatus) => void, errorCallback: (data: string) => void): Promise<void>
	{
		const pi_hole_storage = (await StorageService.get_pi_hole_settings_array());
		for (const pi_hole of pi_hole_storage)
		{
			const api_request: PiHoleApiRequest = new PiHoleApiRequest(pi_hole.pi_uri_base, pi_hole.api_key);

			api_request.onreadystatechange = function() {
				if (this.readyState === 4 && this.status === 200)
				{
					// Action to be performed when the document is read;
					let data: PiHoleApiStatus;
					try
					{
						data = JSON.parse(this.response);   //parse the return JSON
					}
					catch (e)
					{
						errorCallback(ApiJsonErrorMessages.invalid + " - Pihole:" + pi_hole.pi_uri_base);
						return;
					}
					successCallback(data);
				}
				else if (this.status !== 200 && this.status !== 0)
				{
					console.error(this.status);
					errorCallback('API Call failed. Check the address.' + " - Pihole:" + pi_hole.pi_uri_base);
				}
			};

			if (status === PiHoleApiStatusEnum.disabled)
			{
				api_request.add_get_param('disable', String(time));
			}
			else if (status === PiHoleApiStatusEnum.enabled)
			{
				api_request.add_get_param('enable');
			}
			await api_request.send();
		}
	}


	/**
	 * Function to refresh the current PiHoleStatus
	 * @param successCallback Callback that is called once with a valid PiHoleApiStatus
	 */
	export async function refresh_pi_hole_status(successCallback: (data: PiHoleApiStatus) => void): Promise<void>
	{
		const request_promises = [];
		const storage = (await StorageService.get_pi_hole_settings_array());
		if (typeof storage === "undefined")
		{
			return;
		}
		for (const pi_hole of storage)
		{
			const promise_function = (resolve) => refresh_pi_hole_status_promise_function(pi_hole, resolve);

			const pi_hole_promise: Promise<PiHoleApiStatus> = new Promise(promise_function);
			request_promises.push(pi_hole_promise);
		}

		const results: PiHoleApiStatus[] = await Promise.all(request_promises);

		for (const result of results)
		{
			// If any pihole is offline or has an error we use its status
			if (result.status === PiHoleApiStatusEnum.error || result.status === PiHoleApiStatusEnum.disabled)
			{
				console.log(result);
				successCallback(result);
				return;
			}
		}
		successCallback({status: PiHoleApiStatusEnum.enabled});

	}

	/**
	 * Promise function for PiHoleApiService::refresh_pi_hole_status
	 * @param pi_hole_settings
	 * @param resolve
	 */
	function refresh_pi_hole_status_promise_function(pi_hole_settings: PiHoleSettingsStorage, resolve: (value) => void): void
	{
		const api_request: PiHoleApiRequest = new PiHoleApiRequest(pi_hole_settings.pi_uri_base, pi_hole_settings.api_key);

		const onreadystatechange = function() {
			if (this.readyState === 4 && this.status === 200)
			{
				// Action to be performed when the document is read;
				let data: PiHoleApiStatus;
				try
				{
					data = JSON.parse(this.response);
				}
				catch (e)
				{
					console.warn(ApiJsonErrorMessages.invalid);
					const error: PiHoleApiStatus = {status: PiHoleApiStatusEnum.error};
					resolve(error);
				}
				resolve(data);

			}
			else if (this.status !== 200 && this.status !== 0)
			{
				console.log(this.status);
				//BadgeService.set_badge_text(ExtensionBadgeText.error);
				const error: PiHoleApiStatus = {status: PiHoleApiStatusEnum.error};
				resolve(error);
			}
		};

		api_request.add_get_param('status');
		api_request.onreadystatechange = onreadystatechange;

		api_request.send().then();
	}
}
