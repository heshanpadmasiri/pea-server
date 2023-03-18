module.exports = {
    env: {
        browser: true,
    },
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaFeatures: {
            jsx: true,
        },
        ecmaVersion: 2018
    },
    plugins: ['@typescript-eslint', 'react'],
    rules: {
        indent: ['error', 4],
        'linebreak-style': ['error', 'unix'],
        quotes: ['error', 'single'],
    },
    ignorePatterns: ['node_modules', 'web-build', 'babel.config.js'],
    root: true,
};
