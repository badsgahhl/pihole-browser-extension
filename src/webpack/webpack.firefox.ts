import {get_config} from "./webpack.config";

module.exports = (env, argv) => {
	if (argv.mode === 'production')
	{
		return get_config('firefox', true);
	}
	return get_config('firefox', false)
}

