module.exports = {
    root: true,
    "parser": "vue-eslint-parser",
    "parserOptions": {
        parser: '@typescript-eslint/parser',
        project: ['tsconfig.json'],
        tsconfigRootDir: __dirname,
        extraFileExtensions: ['.vue'],
    },
    plugins: [
        '@typescript-eslint',
    ],
    extends: [
        'airbnb-typescript/base',
        'plugin:vue/recommended'
    ],
    "rules": {
        "import/no-extraneous-dependencies": "off",
        "class-methods-use-this": "off",
        "no-restricted-syntax": ["off", "ForOfStatement"],
        "prefer-promise-reject-errors": "off",
        "no-plusplus": "off",
        "no-console": "off"
    }
};
