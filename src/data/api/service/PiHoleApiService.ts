import {PiHoleVersions} from "../models/pihole/PiHoleVersions";
import {PiHoleApiRequest} from "./PiHoleApiRequest";

export module PiHoleApiService
{

	export async function get_pi_hole_version(): Promise<PiHoleVersions>
	{
		const request = new PiHoleApiRequest();

		request.add_get_param('versions');

		const version_promise: Promise<PiHoleVersions> = new Promise((resolve) => {
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
							console.log(`${key} ${value}`);
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
						resolve(versions)
					}
				}
			}
			request.send();
		});

		return await version_promise;
	}
}
