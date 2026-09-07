import { db } from '@/lib/db'
import { STATUS_ORDER, type Status } from '@/lib/status'

export interface BoardCard {
  id: number
  company: string
  role: string
  status: Status
  hasSource: boolean
  /** When this application entered its current column. */
  since: Date
}

export interface BoardColumn {
  status: Status
  cards: BoardCard[]
}

/**
 * The board.
 *
 * Cards show time *in the current column*, which is the newest StatusEvent —
 * not updatedAt, which any edit would move. Applications with no history yet
 * fall back to createdAt rather than disappearing.
 */
export async function getBoard(): Promise<BoardColumn[]> {
  const applications = await db.application.findMany({
    where: { archived: false },
    include: {
      company: { select: { name: true } },
      history: { orderBy: { at: 'desc' }, take: 1, select: { at: true } },
    },
  })

  const cards: BoardCard[] = applications.map((application) => ({
    id: application.id,
    company: application.company.name,
    role: application.role,
    status: application.status as Status,
    hasSource: Boolean(application.sourceUrl),
    since: application.history[0]?.at ?? application.createdAt,
  }))

  // Every column is always present, including empty ones. A pipeline with a
  // missing stage is a pipeline you stop trusting.
  //
  // Within a column, most recent movement first — sorted here rather than in
  // the query because `since` comes from the newest history row, which the
  // database cannot order by without a correlated subquery.
  return STATUS_ORDER.map((status) => ({
    status,
    cards: cards
      .filter((card) => card.status === status)
      .sort((a, b) => b.since.getTime() - a.since.getTime()),
  }))
}

export async function getTally() {
  const [tracked, open] = await Promise.all([
    db.application.count({ where: { archived: false } }),
    db.application.count({
      where: { archived: false, status: { in: ['saved', 'applied', 'interview'] } },
    }),
  ])
  return { tracked, open }
}
