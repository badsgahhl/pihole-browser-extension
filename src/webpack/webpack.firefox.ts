import WebpackConfig from "./WebpackConfig";

const BROWSER = 'firefox';

module.exports = (env: string, argv: any) => {
    let isProduction = false;
    if (argv.mode === 'production') {
        isProduction = true;
    }

    return new WebpackConfig(BROWSER, isProduction).getConfig();
}

