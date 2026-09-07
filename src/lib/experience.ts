import { db } from '@/lib/db'

export const EXPERIENCE_KINDS = ['work', 'project', 'skill', 'achievement'] as const
export type ExperienceKind = (typeof EXPERIENCE_KINDS)[number]

/** Plural, because they label a filter that counts things. */
export const KIND_LABEL: Record<ExperienceKind, string> = {
  work: 'Work history',
  project: 'Projects',
  skill: 'Skills',
  achievement: 'Achievements',
}

/** Singular, for the one place a single entry names its own kind. */
export const KIND_LABEL_ONE: Record<ExperienceKind, string> = {
  work: 'Work history',
  project: 'Project',
  skill: 'Skill',
  achievement: 'Achievement',
}

export function isExperienceKind(value: string): value is ExperienceKind {
  return (EXPERIENCE_KINDS as readonly string[]).includes(value)
}

export interface ExperienceEntryRow {
  id: number
  title: string
  kind: ExperienceKind
  period: string | null
  body: string
  updatedAt: Date
}

export interface KindCount {
  kind: ExperienceKind | 'all'
  label: string
  count: number
}

export async function getEntries(kind?: ExperienceKind): Promise<ExperienceEntryRow[]> {
  const rows = await db.experienceEntry.findMany({
    where: kind ? { kind } : undefined,
    orderBy: { updatedAt: 'desc' },
  })
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    kind: row.kind as ExperienceKind,
    period: row.period,
    body: row.body,
    updatedAt: row.updatedAt,
  }))
}

export async function getEntry(id: number): Promise<ExperienceEntryRow | null> {
  const row = await db.experienceEntry.findUnique({ where: { id } })
  if (!row) return null
  return {
    id: row.id,
    title: row.title,
    kind: row.kind as ExperienceKind,
    period: row.period,
    body: row.body,
    updatedAt: row.updatedAt,
  }
}

/** Drives the filter rail. Every kind is listed even at zero, so the rail
 *  does not reshuffle as entries are added. */
export async function getKindCounts(): Promise<KindCount[]> {
  const grouped = await db.experienceEntry.groupBy({ by: ['kind'], _count: { _all: true } })
  const counts = new Map(grouped.map((row) => [row.kind as ExperienceKind, row._count._all]))
  const total = grouped.reduce((sum, row) => sum + row._count._all, 0)

  return [
    { kind: 'all', label: 'All', count: total },
    ...EXPERIENCE_KINDS.map((kind) => ({
      kind,
      label: KIND_LABEL[kind],
      count: counts.get(kind) ?? 0,
    })),
  ]
}

export async function getLastEdited(): Promise<Date | null> {
  const row = await db.experienceEntry.findFirst({
    orderBy: { updatedAt: 'desc' },
    select: { updatedAt: true },
  })
  return row?.updatedAt ?? null
}
