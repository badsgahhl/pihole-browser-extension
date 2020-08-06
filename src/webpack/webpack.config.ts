import * as webpack from 'webpack';
import * as HtmlWebpackPlugin from "html-webpack-plugin";
import * as ZipPlugin from "zip-webpack-plugin";
import {VueLoaderPlugin} from "vue-loader";
import * as path from "path";
import * as CopyWebpackPlugin from "copy-webpack-plugin";
import * as TerserJSPlugin from 'terser-webpack-plugin';

export default class WebpackConfig
{
	private readonly browser: string;

	private readonly is_production: boolean;

	public constructor(browser: string, is_production: boolean)
	{
		this.browser = browser;
		this.is_production = is_production;
	}


	public get_config(): webpack.Configuration
	{
		const production = this.is_production;
		const browser = this.browser;

		let config: webpack.Configuration = {
			mode: production ? "production" : "development",
			entry: {
				popup: path.join(__dirname, "../", "module/popup", "popup.ts"),
				options: path.join(__dirname, "../", "module/option", "options.ts"),
				background: path.join(__dirname, "../", "module/background", "background.ts")
			},
			devtool: production ? false : 'inline-source-map',
			output: {
				path: path.join(__dirname, "../../dist/" + browser),
				filename: "[name].js"
			},
			module: {
				rules: [
					{
						test: /\.vue$/,
						loader: 'vue-loader',
					},
					{
						test: /\.tsx?$/,
						loader: 'ts-loader',
						exclude: /node_modules/,
						options: {
							appendTsSuffixTo: [/\.vue$/]
						}
					},
					{
						test: /\.scss$/,
						use: [
							'vue-style-loader',
							'css-loader',
							{
								loader: 'sass-loader',
							}
						]
					}
				]
			},
			resolve: {
				extensions: [
					".tsx",
					".ts",
					".js",
					".vue"
				],
				alias: {
					'vue$': 'vue/dist/vue.esm.js'
				}
			},
			optimization: {
				splitChunks: {
					chunks: 'all',
				},
				minimize: true,
				minimizer: [
					new TerserJSPlugin(),
				],

			},
			plugins: [
				new CopyWebpackPlugin([
												 {
													 from: "manifest." + browser + ".json",
													 to: "manifest.json"
												 },
												 {
													 from: "_locales", to: '_locales'
												 },
												 {
													 from: "icon", to: 'icon',
												 }
											 ]),
				new HtmlWebpackPlugin({
												 template: path.join(__dirname, "../", "module/popup", "popup.html"),
												 filename: "popup.html",
												 chunks: ["popup"]
											 }),
				new HtmlWebpackPlugin({
												 template: path.join(__dirname, "../", "module/option", "options.html"),
												 filename: "options.html",
												 chunks: ["options"]
											 }),
				new HtmlWebpackPlugin({
												 template: path.join(__dirname, "../", "module/background", "background.html"),
												 filename: "background.html",
												 chunks: ["background"]
											 }),
				new VueLoaderPlugin(),
			]
		};

		if (production)
		{
			if (config.plugins)
			{
				const zip_options = {
					filename: "package." + browser + ".zip",
					path: path.join(__dirname, '../../')
				};
				config.plugins.push(new ZipPlugin(zip_options));
			}
		}

		return config;
	}
}
