import { db } from '@/lib/db'
import { STATUS_ORDER, type Status } from '@/lib/status'

export interface CompanyRow {
  id: number
  name: string
  applications: number
  /** The most recent application's status — what you last heard. */
  latestStatus: Status
  latestRole: string
  lastActivity: Date
  hasSource: boolean
}

/**
 * The companies index.
 *
 * Everything here is derived rather than stored — a company row carries only
 * a name. It includes archived applications, which is the point: a company
 * you applied to last year and forgot is exactly the row worth seeing before
 * applying again.
 */
export async function getCompanies(openOnly = false): Promise<CompanyRow[]> {
  const companies = await db.company.findMany({
    include: {
      applications: {
        include: { history: { orderBy: { at: 'desc' }, take: 1, select: { at: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { name: 'asc' },
  })

  const open: Status[] = ['saved', 'applied', 'interview']

  return companies
    .filter((company) => company.applications.length > 0)
    .map((company) => {
      const latest = company.applications[0]!
      return {
        id: company.id,
        name: company.name,
        applications: company.applications.length,
        latestStatus: latest.status as Status,
        latestRole: latest.role,
        lastActivity: latest.history[0]?.at ?? latest.createdAt,
        hasSource: Boolean(latest.sourceUrl),
      }
    })
    .filter((row) => !openOnly || open.includes(row.latestStatus))
    .sort((a, b) => {
      // Most recent activity first, then alphabetically — a company you heard
      // from yesterday matters more than one you contacted in March.
      const byActivity = b.lastActivity.getTime() - a.lastActivity.getTime()
      return byActivity !== 0 ? byActivity : a.name.localeCompare(b.name)
    })
}

export function statusRank(status: Status): number {
  return STATUS_ORDER.indexOf(status)
}
