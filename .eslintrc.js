module.exports = {
  root: true,
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2021,
    ecmaFeatures: {
      globalReturn: false,
      impliedStrict: false,
      jsx: false,
    },
  },
  env: {
    es6: true,
    browser: true,
    node: true,
  },
  extends: [
    // 'plugin:svelte/base',
    'plugin:svelte/recommended',
    'plugin:prettier/recommended',
    'plugin:svelte/prettier',
  ],
  plugins: ['prettier'],
  overrides: [
    {
      files: ['*.svelte'],
      parser: 'svelte-eslint-parser',
    },
  ],
  ignorePatterns: ['dist/', 'public/'],
  rules: {
    semi: ['error', 'never'], // uncomment if you want to remove ;
    'svelte/valid-compile': [
      'warn',
      {
        ignoreWarnings: false,
      },
    ],
    'svelte/html-quotes': [
      'error',
      {
        prefer: 'double', // or "single"
        dynamic: {
          quoted: true,
          avoidInvalidUnquotedInHTML: false,
        },
      },
    ],
  },
  settings: {
    // ...
  },
}
