import 'dotenv/config'
import { defineConfig } from 'prisma/config'

// Prisma 7 moved the migrate-time connection here, out of schema.prisma.
// This is used by the CLI (migrate, studio) only — the running app connects
// through the driver adapter in src/lib/db.ts.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
})
