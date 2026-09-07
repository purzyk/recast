'use client'

import { useState } from 'react'
import * as buttonStyles from './button.css'
import { deleteApplication } from '@/app/applications/[id]/actions'

/**
 * Inline confirm rather than a modal.
 *
 * The design system has no dialog component, and adding one for a control
 * used twice a year would be the tail wagging the dog. Two clicks with the
 * wording changing in between gives the same protection: the second button
 * says what it will do, and Cancel is the wider target.
 */
export function DeleteApplication({ id, company }: { id: number; company: string }) {
  const [confirming, setConfirming] = useState(false)

  if (!confirming) {
    return (
      <button type="button" className={buttonStyles.button.danger} onClick={() => setConfirming(true)}>
        Delete
      </button>
    )
  }

  return (
    <form action={deleteApplication} style={{ display: 'flex', gap: 8 }}>
      <input type="hidden" name="id" value={id} />
      <button type="button" className={buttonStyles.button.secondary} onClick={() => setConfirming(false)}>
        Cancel
      </button>
      <button type="submit" className={buttonStyles.button.danger}>
        Delete {company} for good
      </button>
    </form>
  )
}
