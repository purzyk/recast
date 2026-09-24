export const DOCUMENT_KINDS = ['cv', 'coverLetter'] as const
export type DocumentKind = (typeof DOCUMENT_KINDS)[number]

export const DOCUMENT_LABEL: Record<DocumentKind, string> = {
  cv: 'CV',
  coverLetter: 'Cover letter',
}

export function isDocumentKind(value: string): value is DocumentKind {
  return (DOCUMENT_KINDS as readonly string[]).includes(value)
}

/** Where a block sits in the rendered CV. The renderer reads the fixed parts
 *  (employer, dates, links) from the entry the slot names, never from text
 *  the model wrote. */
export type BlockSlot =
  | { type: 'headline' }
  | { type: 'summary' }
  | { type: 'skills' }
  /** Bullets of a job, or of one of its projects when `projectId` is set. */
  | { type: 'job'; entryId: number; projectId: number | null }
  /** One row of Selected Projects. */
  | { type: 'project'; entryId: number }
  | { type: 'letter' }

export interface DocumentBlock {
  id: string
  label: string
  /**
   * Every format is plain text so every block edits the same way:
   * list — one item per line; skills — one "Label: items" row per line;
   * line — a single line. Text may carry **bold**.
   */
  format: 'paragraph' | 'list' | 'skills' | 'line'
  text: string
  /** Experience entry ids this block drew on. */
  sources: number[]
  edited: boolean
  /** Absent on documents generated before the CV template existed. */
  slot?: BlockSlot
}

export interface Requirement {
  /** Quoted verbatim from the posting, so it can be found and underlined. */
  phrase: string
  /** Empty means nothing in the library evidences it. */
  sources: number[]
}

export interface DocumentContent {
  blocks: DocumentBlock[]
  requirements: Requirement[]
}

