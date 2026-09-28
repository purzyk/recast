import { defineConfig, devices } from '@playwright/test'
import { APP_PORT, AUTH_SECRET, BASE_URL, DATABASE_URL, STORAGE_STATE, STUB_PORT } from './e2e/env'

const CI = Boolean(process.env.CI)

export default defineConfig({
  testDir: 'e2e',
  // One shared database: specs run one at a time so they never race on it.
  workers: 1,
  fullyParallel: false,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    locale: 'en-GB',
    timezoneId: 'Europe/Warsaw',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /global\.setup\.ts/ },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], storageState: STORAGE_STATE },
      dependencies: ['setup'],
      testIgnore: /mobile\.spec\.ts/,
    },
    {
      name: 'phone',
      use: { ...devices['Pixel 7'], storageState: STORAGE_STATE },
      dependencies: ['setup'],
      testMatch: /mobile\.spec\.ts/,
    },
  ],
  webServer: [
    {
      command: 'node e2e/anthropic-stub.mjs',
      url: `http://localhost:${STUB_PORT}`,
      env: { STUB_PORT: String(STUB_PORT) },
      reuseExistingServer: !CI,
    },
    {
      // A production build rather than next dev: it is what ships, and it
      // does not fight a dev server already running from this directory.
      command: `npm run build && npx next start -p ${APP_PORT}`,
      // Not /api/health: that reports 503 until the setup project has
      // created the database, and setup only runs once this server is up.
      url: `${BASE_URL}/signin`,
      timeout: 300_000,
      reuseExistingServer: !CI,
      env: {
        DATABASE_URL,
        AUTH_SECRET,
        AUTH_GOOGLE_ID: 'e2e',
        AUTH_GOOGLE_SECRET: 'e2e',
        AUTH_ALLOWED_EMAILS: 'e2e@example.com',
        ANTHROPIC_API_KEY: 'stub',
        ANTHROPIC_BASE_URL: `http://localhost:${STUB_PORT}`,
        RECAST_MODEL: 'claude-stub',
      },
    },
  ],
})
