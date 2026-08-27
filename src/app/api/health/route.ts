import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Never prerendered — a build-time snapshot of database health is meaningless.
export const dynamic = 'force-dynamic'

// Reports whether the app can actually reach the database, not just whether
// the process is up. Returns 503 on failure so a health check treats it as
// unhealthy rather than reading a 200 with a sad message inside.
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`
    const applications = await db.application.count()
    return NextResponse.json({ status: 'ok', database: 'connected', applications })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        database: 'unreachable',
        message: error instanceof Error ? error.message : 'unknown error',
      },
      { status: 503 },
    )
  }
}
