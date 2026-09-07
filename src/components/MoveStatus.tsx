'use client'

import { useRef } from 'react'
import * as fieldStyles from './field.css'
import { srOnly } from '@/styles/utils.css'
import { STATUS_ORDER, STATUS_LABEL, type Status } from '@/lib/status'
import { moveApplication } from '@/app/applications/[id]/actions'

/**
 * Status changes from here, not by dragging the card — a select that writes a
 * history entry is simpler than making the badge itself a menu.
 *
 * Submits on change rather than behind a separate button: there is no draft
 * state worth keeping, and an unsubmitted select would be a lie about where
 * the application actually is.
 */
export function MoveStatus({ id, status }: { id: number; status: Status }) {
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <form ref={formRef} action={moveApplication} className={fieldStyles.selectWrap}>
      <input type="hidden" name="id" value={id} />
      <label htmlFor="move-status" className={srOnly}>
        Move to another status
      </label>
      <select
        id="move-status"
        name="status"
        // Remount when the status changes. Without the key React keeps the
        // uncontrolled DOM value after revalidation, leaving the select
        // showing the previous status while the badge beside it shows the new
        // one — the control and the record disagreeing on screen.
        key={status}
        defaultValue={status}
        onChange={() => formRef.current?.requestSubmit()}
        className={`${fieldStyles.control} ${fieldStyles.select}`}
      >
        {STATUS_ORDER.map((option) => (
          <option key={option} value={option}>
            {STATUS_LABEL[option]}
          </option>
        ))}
      </select>
      <span className={fieldStyles.caret} aria-hidden>
        <svg width={10} height={10} viewBox="0 0 10 10" focusable="false">
          <path d="M2 4 5 7 8 4" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" />
        </svg>
      </span>
    </form>
  )
}
