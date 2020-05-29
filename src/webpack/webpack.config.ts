import * as webpack from 'webpack';

const path = require("path");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ZipPlugin = require('zip-webpack-plugin');


export function get_config(browser: string, production: boolean): webpack.Configuration
{
	let config: webpack.Configuration = {
		mode: "development",
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
					test: /\.tsx?$/,
					loader: 'ts-loader',
					exclude: /node_modules/,
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
				".js"
			],
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
										 })
		]
	};


	if (production)
	{
		config.plugins.push(new ZipPlugin({
														 filename: "package." + browser + ".zip",
														 path: path.join(__dirname, '../../')
													 }));
	}

	return config;
}
