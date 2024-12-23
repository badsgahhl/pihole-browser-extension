import { Configuration } from 'webpack'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import ZipPlugin from 'zip-webpack-plugin'
import * as path from 'path'
import CopyWebpackPlugin from 'copy-webpack-plugin'
import VueLoaderPlugin from 'vue-loader/lib/plugin'
import ESLintWebpackPlugin from 'eslint-webpack-plugin'

export class WebpackConfigFactory {
  public static createConfig(
    browser: Browsers,
    isProduction: boolean
  ): Configuration {
    const mainEntryName =
      browser === Browsers.Chrome ? 'service-worker' : 'background'

    let config: Configuration = {
      mode: isProduction ? 'production' : 'development',
      entry: {
        popup: path.join(__dirname, '../', 'module/popup', 'popup.ts'),
        options: path.join(__dirname, '../', 'module/option', 'options.ts'),
        [mainEntryName]: path.join(
          __dirname,
          '../',
          'module/background',
          `${mainEntryName}.ts`
        )
      },
      devtool: isProduction ? false : 'inline-source-map',
      output: {
        path: path.join(__dirname, '../../dist/' + browser),
        filename: '[name].js'
      },
      module: {
        rules: [
          {
            test: /\.vue$/,
            loader: 'vue-loader'
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
            test: /\.(scss|css)$/,
            use: ['style-loader', 'css-loader', 'sass-loader']
          },
          {
            test: /\.(woff|woff2|ttf|eot)$/,
            use: {
              loader: 'url-loader'
            }
          }
        ]
      },
      resolve: {
        extensions: ['.js', '.ts', '.vue'],
        alias: {
          vue$: 'vue/dist/vue.esm.js'
        }
      },
      optimization: {
        splitChunks: {
          chunks(chunk) {
            return chunk.name !== 'service-worker'
          }
        }
      },
      plugins: [
        new CopyWebpackPlugin({
          patterns: [
            {
              from: 'manifest.' + browser + '.json',
              to: 'manifest.json'
            },
            {
              from: '_locales',
              to: '_locales'
            },
            {
              from: 'icon',
              to: 'icon'
            }
          ]
        }),
        new HtmlWebpackPlugin({
          template: path.join(__dirname, '../', 'module/popup', 'popup.html'),
          filename: 'popup.html',
          chunks: ['popup']
        }),
        new HtmlWebpackPlugin({
          template: path.join(
            __dirname,
            '../',
            'module/option',
            'options.html'
          ),
          filename: 'options.html',
          chunks: ['options']
        }),
        mainEntryName === 'background' &&
          new HtmlWebpackPlugin({
            template: path.join(
              __dirname,
              '../',
              'module/background',
              'background.html'
            ),
            filename: 'background.html',
            chunks: ['background']
          }),
        new VueLoaderPlugin(),
        new ESLintWebpackPlugin({
          extensions: ['ts', 'vue']
        })
      ].filter(Boolean)
    }

    if (isProduction) {
      if (config.plugins) {
        const zip_options: ZipPlugin.Options = {
          filename: 'package.' + browser + '.zip',
          path: path.join(__dirname, '../../')
        }
        config.plugins.push(new ZipPlugin(zip_options))
      }
    }

    return config
  }
}

export interface CliConfigOptions {
  config?: string
  mode?: Configuration['mode']
  env?: string
  'config-register'?: string
  configRegister?: string
  'config-name'?: string
  configName?: string
}

export enum Browsers {
  Chrome = 'chrome',
  Firefox = 'firefox'
}
