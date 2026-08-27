import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma'

// Next evaluates route modules at build time to collect their config, and the
// build environment has no DATABASE_URL. Connecting eagerly at import time
// therefore fails the build. The client is created on first actual use
// instead, so importing this module is always safe.
//
// Dev hot-reload would otherwise open a new pool per reload until Postgres
// refuses connections, hence the globalThis cache.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function getClient(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set')
  }

  const client = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
  globalForPrisma.prisma = client
  return client
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getClient()
    const value = Reflect.get(client, property)
    // Methods must stay bound to the real client, not the proxy.
    return typeof value === 'function' ? value.bind(client) : value
  },
})
