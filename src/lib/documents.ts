import { db } from '@/lib/db'
import type { DocumentContent, DocumentKind } from '@/lib/document-types'

export * from '@/lib/document-types'

export interface DocumentSummary {
  id: number
  kind: DocumentKind
  version: number
  edited: boolean
  createdAt: Date
  updatedAt: Date
}

export interface DocumentDetail extends DocumentSummary {
  applicationId: number
  company: string
  role: string
  jobDescription: string | null
  content: DocumentContent
  model: string
  inputTokens: number
  outputTokens: number
  /** Titles for every entry any block or requirement cites, keyed by id. */
  entryTitles: Map<number, string>
}

export function parseContent(raw: string): DocumentContent {
  const parsed = JSON.parse(raw) as Partial<DocumentContent>
  return { blocks: parsed.blocks ?? [], requirements: parsed.requirements ?? [] }
}

export async function getDocuments(applicationId: number): Promise<DocumentSummary[]> {
  const rows = await db.document.findMany({
    where: { applicationId },
    orderBy: [{ kind: 'asc' }, { version: 'desc' }],
    select: { id: true, kind: true, version: true, edited: true, createdAt: true, updatedAt: true },
  })
  return rows.map((row) => ({ ...row, kind: row.kind as DocumentKind }))
}

export async function getDocument(id: number): Promise<DocumentDetail | null> {
  const row = await db.document.findUnique({
    where: { id },
    include: {
      application: { select: { role: true, jobDescription: true, company: { select: { name: true } } } },
      sources: { include: { entry: { select: { id: true, title: true } } } },
    },
  })
  if (!row) return null

  const content = parseContent(row.content)

  // Requirement matches are not DocumentSource rows (they did not feed the
  // text), so their titles are looked up separately.
  const cited = new Set(content.requirements.flatMap((requirement) => requirement.sources))
  for (const source of row.sources) cited.delete(source.entryId)
  const extra = cited.size
    ? await db.experienceEntry.findMany({ where: { id: { in: [...cited] } }, select: { id: true, title: true } })
    : []

  return {
    id: row.id,
    applicationId: row.applicationId,
    company: row.application.company.name,
    role: row.application.role,
    jobDescription: row.application.jobDescription,
    kind: row.kind as DocumentKind,
    version: row.version,
    edited: row.edited,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    content,
    model: row.model,
    inputTokens: row.inputTokens,
    outputTokens: row.outputTokens,
    entryTitles: new Map([...row.sources.map((source) => source.entry), ...extra].map((entry) => [entry.id, entry.title])),
  }
}

/**
 * Always a new row. The version number is read and written in one
 * transaction; the unique constraint on (application, kind, version) turns a
 * lost race into an error rather than two documents claiming the same number.
 */
export async function createDocumentVersion(input: {
  applicationId: number
  kind: DocumentKind
  content: DocumentContent
  model: string
  inputTokens: number
  outputTokens: number
}): Promise<{ id: number; version: number }> {
  const sourceIds = [...new Set(input.content.blocks.flatMap((block) => block.sources))]

  return db.$transaction(async (tx) => {
    const latest = await tx.document.findFirst({
      where: { applicationId: input.applicationId, kind: input.kind },
      orderBy: { version: 'desc' },
      select: { version: true },
    })
    const version = (latest?.version ?? 0) + 1

    const created = await tx.document.create({
      data: {
        applicationId: input.applicationId,
        kind: input.kind,
        version,
        content: JSON.stringify(input.content),
        model: input.model,
        inputTokens: input.inputTokens,
        outputTokens: input.outputTokens,
        sources: { create: sourceIds.map((entryId) => ({ entryId })) },
      },
      select: { id: true, version: true },
    })
    return created
  })
}

/** Plain text, for pasting into an application form or a CV template. A
 *  cover letter's block labels are scaffolding, not headings, so they stay out. */
export function toPlainText(content: DocumentContent, kind: DocumentKind): string {
  return content.blocks
    .map((block) => {
      const body =
        block.format === 'list'
          ? block.text
              .split('\n')
              .map((line) => line.trim())
              .filter(Boolean)
              .map((line) => `- ${line}`)
              .join('\n')
          : block.text
      return kind === 'cv' ? `${block.label}\n\n${body}` : body
    })
    .join('\n\n')
    .replace(/\*\*/g, '')
}
