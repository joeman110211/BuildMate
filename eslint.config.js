const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      'dist/**',
      '.expo/**',
      'node_modules/**',
      // Playwright/Clerk E2E dependencies are installed only inside the E2E workflow.
      'e2e/**',
      'playwright.config.mjs',
    ],
  },
  {
    // React Native Animated.Value is intentionally held in a stable ref for the
    // lifetime of the landing screen. The React compiler refs rule treats the
    // animated value's render binding as a normal mutable ref, which is not how
    // RN Animated consumes it.
    files: ['app/(public)/index.tsx'],
    rules: {
      'react-hooks/refs': 'off',
    },
  },
]);
