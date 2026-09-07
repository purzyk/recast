'use client'

import { useState } from 'react'
import * as buttonStyles from './button.css'
import { deleteEntry } from '@/app/experience/actions'

/** Same inline-confirm pattern as deleting an application: two clicks, with
 *  the wording changing in between, and no dialog component to introduce. */
export function DeleteEntry({ id, title }: { id: number; title: string }) {
  const [confirming, setConfirming] = useState(false)

  if (!confirming) {
    return (
      <button type="button" className={buttonStyles.button.danger} onClick={() => setConfirming(true)}>
        Delete
      </button>
    )
  }

  return (
    <span style={{ display: 'inline-flex', gap: 8 }}>
      <button type="button" className={buttonStyles.button.secondary} onClick={() => setConfirming(false)}>
        Cancel
      </button>
      <button type="submit" formAction={deleteEntry} className={buttonStyles.button.danger}>
        Delete &ldquo;{title}&rdquo; for good
      </button>
    </span>
  )
}
