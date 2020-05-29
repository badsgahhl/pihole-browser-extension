rm package.chrome.zip
rm package.firefox.zip

zip -r package.chrome.zip dist/ icon/ src/ manifest.chrome.json -x "*.ts"
printf "@ manifest.chrome.json\n@=manifest.json\n" | zipnote -w package.chrome.zip
zip -r package.firefox.zip dist/ icon/ src/ manifest.firefox.json -x "*.ts"
printf "@ manifest.firefox.json\n@=manifest.json\n" | zipnote -w package.firefox.zip
