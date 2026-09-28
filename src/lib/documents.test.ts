import { describe, expect, it } from 'vitest'
import { isDocumentKind, parseContent, toPlainText, type DocumentBlock } from '@/lib/documents'

const block = (overrides: Partial<DocumentBlock>): DocumentBlock => ({
  id: 'b1',
  label: 'Label',
  format: 'paragraph',
  text: '',
  sources: [],
  edited: false,
  ...overrides,
})

describe('parseContent', () => {
  it('fills in missing arrays from older documents', () => {
    expect(parseContent('{}')).toEqual({ blocks: [], requirements: [] })
  })

  it('keeps stored blocks and requirements', () => {
    const content = { blocks: [block({ text: 'Hi' })], requirements: [{ phrase: 'React', sources: [1] }] }
    expect(parseContent(JSON.stringify(content))).toEqual(content)
  })
})

describe('isDocumentKind', () => {
  it('accepts cv and coverLetter only', () => {
    expect(isDocumentKind('cv')).toBe(true)
    expect(isDocumentKind('coverLetter')).toBe(true)
    expect(isDocumentKind('letter')).toBe(false)
  })
})

describe('toPlainText', () => {
  const content = {
    requirements: [],
    blocks: [
      block({ label: 'Summary', text: 'A **frontend** engineer.' }),
      block({ label: 'Talksome', format: 'list', text: 'Built **Compass**\n\n  Wrote tests  ' }),
    ],
  }

  it('heads each CV block with its label and dashes list items', () => {
    expect(toPlainText(content, 'cv')).toBe('Summary\n\nA frontend engineer.\n\nTalksome\n\n- Built Compass\n- Wrote tests')
  })

  it('leaves cover letter labels out', () => {
    expect(toPlainText(content, 'coverLetter')).toBe('A frontend engineer.\n\n- Built Compass\n- Wrote tests')
  })
})
