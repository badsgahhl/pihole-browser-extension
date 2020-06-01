import {PiHoleVersions} from "../models/pihole/PiHoleVersions";
import {PiHoleApiRequest} from "./PiHoleApiRequest";
import {PiHoleSettingsStorage, StorageService} from "../../storage/StorageService";
import {PiHoleApiStatus, PiHoleApiStatusEnum} from "../models/pihole/PiHoleApiStatus";
import {ApiJsonErrorMessages} from "../errors/ApiErrorMessages";
import {BadgeService, ExtensionBadgeText} from "../../storage/BadgeService";

export module PiHoleApiService
{

	export async function get_pi_hole_version(): Promise<PiHoleVersions[]>
	{
		const storage = (await StorageService.get_pi_hole_settings_array());
		let promise_array = [];
		for (const pi_hole_setting of storage)
		{
			const request = new PiHoleApiRequest(pi_hole_setting.pi_uri_base, pi_hole_setting.api_key);

			request.add_get_param('versions');

			promise_array.push(new Promise((resolve) => {

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
				request.send();
			}));
		}

		return await Promise.all(promise_array);
	}

	/**
	 * Function to get the current PiHoleStatus
	 */
	export async function refresh_pi_hole_status(successCallback: (data: PiHoleApiStatus) => void): Promise<void>
	{
		StorageService.get_pi_hole_settings_array().then(storage => check_status_for_pi_hole(storage, 0, successCallback));
	}

	function check_status_for_pi_hole(pi_hole_storage: PiHoleSettingsStorage[], iteration: number, successCallback: (data: PiHoleApiStatus) => void): void
	{
		if (iteration >= pi_hole_storage.length)
		{
			return;
		}
		const pi_hole = pi_hole_storage[iteration];

		const promise_function = (resolve) => {
			const api_request: PiHoleApiRequest = new PiHoleApiRequest(pi_hole.pi_uri_base, pi_hole.api_key);

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
						return;
					}
					// The last pihole changes finally the icon and text
					if ((iteration + 1) === pi_hole_storage.length)
					{
						successCallback(data);
					}

					if (data.status === PiHoleApiStatusEnum.enabled)
					{
						resolve();
					}
					else
					{
						successCallback(data);
					}
				}
				else if (this.status !== 200 && this.status !== 0)
				{
					console.log(this.status);
					BadgeService.set_badge_text(ExtensionBadgeText.error);
				}
			};

			api_request.add_get_param('status');
			api_request.onreadystatechange = onreadystatechange;

			api_request.send().then();
		};

		const promise = new Promise(promise_function);
		// Only check the next piholes if the current is enabled
		promise.then(() => check_status_for_pi_hole(pi_hole_storage, iteration + 1, successCallback));
	}
}
