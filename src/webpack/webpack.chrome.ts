import {get_config} from "./webpack.config";


module.exports = (env, argv) => {
	if (argv.mode === 'production')
	{
		return get_config('chrome', true);
	}
	return get_config('chrome', false)
}
