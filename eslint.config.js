const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/**', '.expo/**', 'node_modules/**'] },
  {
    files: ['e2e/**/*.cjs'],
    rules: {
      'import/no-unresolved': 'off',
      'import/no-extraneous-dependencies': 'off',
    },
  },
]);
