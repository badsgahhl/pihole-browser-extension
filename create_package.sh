rm package.zip

zip -r package.zip dist/ icon/ src/ manifest.json -x "*.ts"

