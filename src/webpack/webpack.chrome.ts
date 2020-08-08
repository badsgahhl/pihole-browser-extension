import * as webpack from "webpack";
import WebpackConfig from "./WebpackConfig";

const BROWSER = 'chrome';

module.exports = (env: string, argv: webpack.WebpackOptionsNormalized) => {
	let is_production = false;
	if (argv.mode === 'production')
	{
		is_production = true;
	}

	return new WebpackConfig(BROWSER, is_production).get_config();
}
