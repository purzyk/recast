import { defineConfig } from '@playwright/test'
import { version } from '@playwright/test/package.json'
import base from './playwright.config'
import { STORAGE_STATE } from './e2e/env'

// Screenshots depend on the OS: fonts, hinting and anti-aliasing differ
// between Windows, macOS and Linux. So the browser always runs in the official
// Playwright Linux image, on every machine and in CI, while the tests and the
// app stay on the host. `exposeNetwork` lets that browser reach the host's
// localhost, so baseURL works unchanged.
const BROWSER_PORT = 3102
const IMAGE = `mcr.microsoft.com/playwright:v${version}-noble`

export default defineConfig({
  ...base,
  // One file per screenshot, no OS suffix: there is only one rendering OS.
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}{ext}',
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.002 },
  },
  projects: [
    { name: 'setup', testMatch: /global\.setup\.ts/ },
    {
      name: 'visual',
      testMatch: /visual\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        browserName: 'chromium',
        viewport: { width: 1440, height: 900 },
        storageState: STORAGE_STATE,
        connectOptions: { wsEndpoint: `ws://127.0.0.1:${BROWSER_PORT}/`, exposeNetwork: '<loopback>' },
      },
    },
  ],
  webServer: [
    ...(Array.isArray(base.webServer) ? base.webServer : []),
    {
      command: `docker run --rm --init -p ${BROWSER_PORT}:${BROWSER_PORT} ${IMAGE} /bin/sh -c "npx -y playwright@${version} run-server --port ${BROWSER_PORT} --host 0.0.0.0"`,
      url: `http://127.0.0.1:${BROWSER_PORT}/`,
      timeout: 300_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
})
