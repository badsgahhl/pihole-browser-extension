import * as webpack from 'webpack';

const path = require("path");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ZipPlugin = require('zip-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin')


export function get_config(browser: string, production: boolean): webpack.Configuration
{
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
					test: /\.css$/,
					loader: "style-loader!css-loader",
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
			}
		},
		plugins: [
			// expose and write the allowed env vars on the compiled bundle
			new CopyWebpackPlugin([
											 {
												 from: "manifest." + browser + ".json",
												 to: "manifest.json"
											 }
										 ]),
			new CopyWebpackPlugin([
											 {
												 from: "icon", to: 'icon',
											 }
										 ]),
			new CopyWebpackPlugin([
											 {
												 from: "_locales", to: '_locales'
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
			new VueLoaderPlugin()
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
