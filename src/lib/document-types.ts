export const DOCUMENT_KINDS = ['cv', 'coverLetter'] as const
export type DocumentKind = (typeof DOCUMENT_KINDS)[number]

export const DOCUMENT_LABEL: Record<DocumentKind, string> = {
  cv: 'CV',
  coverLetter: 'Cover letter',
}

export function isDocumentKind(value: string): value is DocumentKind {
  return (DOCUMENT_KINDS as readonly string[]).includes(value)
}

export interface DocumentBlock {
  id: string
  label: string
  /** A list block stores one item per line, so editing it is editing text. */
  format: 'paragraph' | 'list'
  text: string
  /** Experience entry ids this block drew on. */
  sources: number[]
  edited: boolean
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

