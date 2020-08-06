import * as webpack from "webpack";
import WebpackConfig from "./webpack.config";

const BROWSER = 'firefox';

module.exports = (env: string, argv: webpack.loader.LoaderContext) => {
	let is_production = false;
	if (argv.mode === 'production')
	{
		is_production = true;
	}

	return new WebpackConfig(BROWSER, is_production).get_config();
}

