import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { test as setup } from '@playwright/test'
import { encode } from 'next-auth/jwt'
import pg from 'pg'
import { AUTH_SECRET, BASE_URL, DATABASE_URL, STORAGE_STATE } from './env'
import { seed } from './seed'

async function ensureDatabase() {
  const url = new URL(DATABASE_URL)
  const name = url.pathname.slice(1)
  url.pathname = '/postgres'
  const client = new pg.Client({ connectionString: url.toString() })
  await client.connect()
  const { rowCount } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [name])
  if (!rowCount) await client.query(`CREATE DATABASE "${name}"`)
  await client.end()
}

setup('database and session', async () => {
  await ensureDatabase()
  execSync('npx prisma migrate deploy', { env: { ...process.env, DATABASE_URL }, stdio: 'inherit' })
  await seed(DATABASE_URL)

  // Google sign-in cannot run in a test, so the session cookie is minted
  // directly, the same way Auth.js would after a successful callback.
  const token = await encode({
    token: { name: 'E2E', email: 'e2e@example.com', sub: 'e2e' },
    secret: AUTH_SECRET,
    salt: 'authjs.session-token',
  })
  const { hostname } = new URL(BASE_URL)
  const state = {
    cookies: [
      {
        name: 'authjs.session-token',
        value: token,
        domain: hostname,
        path: '/',
        expires: Math.floor(Date.now() / 1000) + 86_400,
        httpOnly: true,
        secure: false,
        sameSite: 'Lax' as const,
      },
    ],
    origins: [],
  }
  fs.mkdirSync(path.dirname(STORAGE_STATE), { recursive: true })
  fs.writeFileSync(STORAGE_STATE, JSON.stringify(state))
})
