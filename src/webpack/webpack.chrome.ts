import {get_config} from "./webpack.config";
import * as webpack from "webpack";


module.exports = (env: string, argv: webpack.loader.LoaderContext) => {
	if (argv.mode === 'production')
	{
		return get_config('chrome', true);
	}
	return get_config('chrome', false)
}
