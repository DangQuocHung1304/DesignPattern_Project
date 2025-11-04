// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
    rules: {
      // Disable import resolution errors for TypeScript files
      'import/no-unresolved': 'off',
      'import/extensions': 'off',
    },
  },
]);
