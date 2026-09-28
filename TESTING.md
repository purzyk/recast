# Testing

| Command                      | What it runs                                          | Needs                            |
| ---------------------------- | ----------------------------------------------------- | -------------------------------- |
| `npm test`                   | Vitest unit tests (`src/**/*.test.ts`)                | nothing                          |
| `npm run test:e2e`           | Playwright e2e tests (`e2e/*.spec.ts`)                | `docker compose up -d db`        |
| `npm run test:visual`        | Screenshot comparison (`e2e/visual.spec.ts`)          | the db, and Docker for the browser |
| `npm run test:visual:update` | Rewrites the reference screenshots                    | same                             |
| `npm run lint`               | ESLint, zero warnings allowed                         | nothing                          |
| `npm run format:check`       | Prettier                                              | nothing                          |

CI (`.github/workflows/ci.yml`) runs all of them on every branch and pull request.
`deploy.yml` runs the same workflow and deploys only if it passes.

## How the e2e setup works

- **Database:** a separate `recast_test` database, reset and seeded from `e2e/seed.ts` on every run.
  Development data is never touched. The seed is fictional.
- **Sign-in:** `e2e/global.setup.ts` mints the Auth.js session cookie directly, so Google is never involved.
- **Anthropic API:** `e2e/anthropic-stub.mjs` stands in for it through `ANTHROPIC_BASE_URL`. It streams
  answers built from the request's own entries, so runs are free and deterministic. A posting containing
  `[stub:refuse]` gets a refusal.
- **Server:** a production build on port 3100, so it can run beside `npm run dev`.

## Visual regression

Fonts render differently on Windows, macOS and Linux, so the browser always runs inside the
official Playwright Linux image (started by `playwright.visual.config.ts`), locally and in CI.
Reference screenshots therefore match everywhere; never generate them with a local browser.

Absolute dates are masked; relative times ("3d") are stable because the seed is dated relative to now.

When a change to the UI is intended:

1. `npm run test:visual:update`
2. Look at the changed files in `e2e/__screenshots__/` before committing them.

When CI fails, download the `visual-report` artifact: it has the expected, actual
and diff image for each failure.
