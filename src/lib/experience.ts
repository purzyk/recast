import { db } from '@/lib/db'
import { EXPERIENCE_KINDS, KIND_LABEL, type ExperienceKind } from '@/lib/experience-kinds'

export * from '@/lib/experience-kinds'

export interface ExperienceEntryRow {
  id: number
  title: string
  kind: ExperienceKind
  period: string | null
  body: string
  links: string | null
  parentId: number | null
  updatedAt: Date
}

export interface EntryLink {
  label: string
  url: string
}

/** "label url" per line. The URL is the last whitespace-separated token, so
 *  a label may contain spaces. */
export function parseLinks(raw: string | null): EntryLink[] {
  if (!raw) return []
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      const at = line.lastIndexOf(' ')
      const url = at < 0 ? line : line.slice(at + 1)
      if (!/^https?:\/\//.test(url)) return []
      return [{ label: at < 0 ? new URL(url).hostname : line.slice(0, at).trim(), url }]
    })
}

/** Intro prose and "- " bullets, the shape work and project bodies are
 *  written in and rendered as. */
export function splitBody(body: string): { intro: string; bullets: string[] } {
  const intro: string[] = []
  const bullets: string[] = []
  for (const raw of body.split('\n')) {
    const line = raw.trim()
    if (!line) continue
    if (line.startsWith('- ')) bullets.push(line.slice(2).trim())
    else intro.push(line)
  }
  return { intro: intro.join(' '), bullets }
}

/** Newest first by the latest year a period mentions; "present" and
 *  "ongoing" count as now. Periods are free text, so this is a heuristic —
 *  good enough to order a CV's jobs without asking for a date field. */
export function periodEnd(period: string | null): number {
  if (!period) return 0
  if (/present|ongoing|now/i.test(period)) return 9999
  const years = period.match(/\d{4}/g)?.map(Number) ?? []
  return years.length ? Math.max(...years) : 0
}

export interface KindCount {
  kind: ExperienceKind | 'all'
  label: string
  count: number
}

export async function getEntries(kind?: ExperienceKind): Promise<(ExperienceEntryRow & { usedIn: number })[]> {
  const rows = await db.experienceEntry.findMany({
    where: kind ? { kind } : undefined,
    orderBy: { updatedAt: 'desc' },
    include: { _count: { select: { usedIn: true } } },
  })
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    kind: row.kind as ExperienceKind,
    period: row.period,
    body: row.body,
    links: row.links,
    parentId: row.parentId,
    updatedAt: row.updatedAt,
    usedIn: row._count.usedIn,
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
    links: row.links,
    parentId: row.parentId,
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
