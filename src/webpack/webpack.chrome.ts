import {
  Browsers,
  CliConfigOptions,
  WebpackConfigFactory
} from './WebpackConfigFactory'

module.exports = (env: string, argv: CliConfigOptions) => {
  return WebpackConfigFactory.createConfig(
    Browsers.Chrome,
    argv.mode === 'production'
  )
}
