import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import playwright from 'eslint-plugin-playwright'
import prettier from 'eslint-config-prettier/flat'

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Destructuring a key away to drop it is deliberate, not an unused variable.
      '@typescript-eslint/no-unused-vars': ['warn', { ignoreRestSiblings: true }],
    },
  },
  {
    files: ['e2e/**/*.ts'],
    ...playwright.configs['flat/recommended'],
  },
  {
    // Setup prepares state; the specs that depend on it do the asserting.
    files: ['e2e/global.setup.ts'],
    rules: { 'playwright/expect-expect': 'off' },
  },
  // Formatting is Prettier's job; this turns off every rule that would fight it.
  prettier,
  globalIgnores(['.next/**', 'src/generated/**', 'next-env.d.ts', 'playwright-report/**', 'test-results/**']),
])
