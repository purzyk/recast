import { db } from '@/lib/db'
import { STATUS_LABEL, type Status } from '@/lib/status'

export interface HistoryEntry {
  id: number
  status: Status
  at: Date
}

export interface DetailNote {
  id: number
  body: string
  createdAt: Date
}

export interface ApplicationDetail {
  id: number
  company: string
  companyId: number
  role: string
  status: Status
  sourceUrl: string | null
  jobDescription: string | null
  archived: boolean
  lastContactAt: Date | null
  createdAt: Date
  history: HistoryEntry[]
  notes: DetailNote[]
  /** When it entered the current column — newest history row, or creation. */
  since: Date
}

export async function getApplication(id: number): Promise<ApplicationDetail | null> {
  const row = await db.application.findUnique({
    where: { id },
    include: {
      company: { select: { id: true, name: true } },
      history: { orderBy: { at: 'desc' } },
      notes: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!row) return null

  return {
    id: row.id,
    company: row.company.name,
    companyId: row.company.id,
    role: row.role,
    status: row.status as Status,
    sourceUrl: row.sourceUrl,
    jobDescription: row.jobDescription,
    archived: row.archived,
    lastContactAt: row.lastContactAt,
    createdAt: row.createdAt,
    history: row.history.map((entry) => ({
      id: entry.id,
      status: entry.status as Status,
      at: entry.at,
    })),
    notes: row.notes,
    since: row.history[0]?.at ?? row.createdAt,
  }
}

/**
 * The nudge under the record pane: "Five days in Applied. Chase at fourteen."
 *
 * Only for stages where waiting is the normal state and chasing is the useful
 * action. Offer and rejected are terminal — there is nothing to chase.
 */
export function chaseHint(status: Status, since: Date, now: Date = new Date()): string | null {
  if (status !== 'applied' && status !== 'interview') return null

  const days = Math.floor((now.getTime() - since.getTime()) / 86_400_000)
  const threshold = status === 'applied' ? 14 : 7

  const label = STATUS_LABEL[status]
  if (days >= threshold) {
    return `${days} days in ${label}. Worth chasing.`
  }
  if (days === 0) {
    return `Moved to ${label} today. Chase at ${threshold} days.`
  }
  return `${days} ${days === 1 ? 'day' : 'days'} in ${label}. Chase at ${threshold}.`
}
