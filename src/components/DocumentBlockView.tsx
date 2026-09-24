'use client'

import { useState, useTransition } from 'react'
import * as screen from './screen.css'
import * as buttonStyles from './button.css'
import * as fieldStyles from './field.css'
import * as styles from './tailoring.css'
import type { DocumentBlock } from '@/lib/document-types'
import { updateBlock } from '@/app/applications/[id]/actions'

export function DocumentBlockView({
  documentId,
  block,
  sourceTitles,
}: {
  documentId: number
  block: DocumentBlock
  sourceTitles: string[]
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(block.text)
  const [pending, startTransition] = useTransition()

  function save() {
    startTransition(async () => {
      await updateBlock(documentId, block.id, draft)
      setEditing(false)
    })
  }

  const items = block.text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  return (
    <div className={screen.block}>
      <div className={styles.blockTop}>
        <span className={screen.blockLabel}>{block.label}</span>
        {block.edited && <span className={screen.editedMark}>edited</span>}
        {!editing && (
          <button type="button" className={`${screen.blockEdit} ${styles.editButton}`} onClick={() => setEditing(true)}>
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <div className={styles.editor}>
          <textarea
            aria-label={`Edit ${block.label}`}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={Math.max(4, draft.split('\n').length + 1)}
            autoFocus
            className={`${fieldStyles.control} ${fieldStyles.textarea}`}
          />
          {block.format === 'list' && <span className={fieldStyles.hint}>One item per line</span>}
          <div className={styles.editorActions}>
            <button type="button" onClick={save} disabled={pending} className={buttonStyles.button.secondary}>
              {pending ? 'Saving…' : 'Save block'}
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft(block.text)
                setEditing(false)
              }}
              disabled={pending}
              className={buttonStyles.button.ghost}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : block.format === 'list' ? (
        <ul className={styles.blockList}>
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className={styles.blockText}>{block.text}</p>
      )}

      <p className={screen.provenance}>
        drawn from:{' '}
        <span className={styles.sources}>
          {sourceTitles.length ? sourceTitles.join(' · ') : 'no entries cited — check this block by hand'}
        </span>
      </p>
    </div>
  )
}
