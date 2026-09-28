// Settings shared by the Playwright config, the setup step and the app
// server it starts. The database is a separate one, so a run never touches
// the data used for development or recordings.
export const APP_PORT = 3100
export const STUB_PORT = 3101
export const BASE_URL = `http://localhost:${APP_PORT}`

export const DATABASE_URL = process.env.E2E_DATABASE_URL ?? 'postgresql://recast:recast@localhost:5432/recast_test'

export const AUTH_SECRET = 'e2e-only-secret-not-used-anywhere-else'

export const STORAGE_STATE = 'e2e/.auth/state.json'
