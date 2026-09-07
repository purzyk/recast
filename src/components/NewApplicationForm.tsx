'use client'

import Link from 'next/link'
import { useEffect, useState, useTransition } from 'react'
import * as fieldStyles from './field.css'
import * as buttonStyles from './button.css'
import * as warnStyles from './inlineWarning.css'
import * as styles from '@/app/applications/new/page.css'
import { statusTone } from '@/styles/status.css'
import { srOnly } from '@/styles/utils.css'
import { STATUS_LABEL } from '@/lib/status'
import { elapsed } from '@/lib/elapsed'
import { StatusBadge } from './StatusBadge'
import { createApplication, findDuplicate, type DuplicateMatch } from '@/app/applications/new/actions'

/**
 * The duplicate guard warns; it never blocks. A company reposting a role you
 * genuinely want again has to stay addable — so the warning offers the
 * existing record as the easier path and gets out of the way.
 *
 * The check runs as you type rather than on submit: finding out you already
 * applied *after* filling in a job description is finding out too late.
 */
export function NewApplicationForm() {
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [duplicate, setDuplicate] = useState<DuplicateMatch | null>(null)
  const [, startTransition] = useTransition()
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!company.trim() || !role.trim()) {
      setDuplicate(null)
      return
    }
    // Debounced: one lookup per pause, not one per keystroke.
    const timer = setTimeout(() => {
      startTransition(async () => {
        setDuplicate(await findDuplicate(company, role))
      })
    }, 350)
    return () => clearTimeout(timer)
  }, [company, role])

  return (
    <form action={createApplication} onSubmit={() => setPending(true)} className={styles.form}>
      <h2 className={styles.sectionLabel}>The posting</h2>

      <div className={styles.row}>
        <div className={fieldStyles.field}>
          <label htmlFor="company" className={fieldStyles.label}>
            Company
          </label>
          <input
            id="company"
            name="company"
            required
            autoComplete="off"
            className={fieldStyles.control}
            value={company}
            onChange={(event) => setCompany(event.target.value)}
          />
        </div>

        <div className={fieldStyles.field}>
          <label htmlFor="role" className={fieldStyles.label}>
            Role title
          </label>
          <input
            id="role"
            name="role"
            required
            autoComplete="off"
            className={fieldStyles.control}
            value={role}
            onChange={(event) => setRole(event.target.value)}
          />
        </div>
      </div>

      {duplicate && (
        <div className={warnStyles.warning} role="status">
          <span className={warnStyles.label}>Already in your pipeline</span>
          <p className={warnStyles.text}>
            You applied to this company and role before. Open that record instead of starting a
            second one?
          </p>
          <div className={`${warnStyles.record} ${statusTone[duplicate.status]}`}>
            <span className={warnStyles.recordCompany}>{duplicate.company}</span>
            <span className={warnStyles.recordRole}>{duplicate.role}</span>
            <span className={warnStyles.recordMeta}>
              {STATUS_LABEL[duplicate.status].toLowerCase()} {elapsed(duplicate.since)}
            </span>
          </div>
          <div className={warnStyles.actions}>
            <Link href={`/applications/${duplicate.id}`} className={buttonStyles.button.secondary}>
              Open the existing one
            </Link>
            <button
              type="button"
              className={buttonStyles.button.ghost}
              onClick={() => setDuplicate(null)}
            >
              Add anyway
            </button>
          </div>
        </div>
      )}

      <div className={styles.row}>
        <div className={fieldStyles.field}>
          <label htmlFor="status" className={fieldStyles.label}>
            Status
          </label>
          <div className={fieldStyles.selectWrap}>
            <select
              id="status"
              name="status"
              defaultValue="saved"
              className={`${fieldStyles.control} ${fieldStyles.select}`}
            >
              {/* Only the two a new record can honestly start in. */}
              <option value="saved">Saved</option>
              <option value="applied">Applied</option>
            </select>
            <span className={fieldStyles.caret} aria-hidden>
              <svg width={10} height={10} viewBox="0 0 10 10" focusable="false">
                <path d="M2 4 5 7 8 4" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" />
              </svg>
            </span>
          </div>
        </div>

        <div className={fieldStyles.field}>
          <label htmlFor="date" className={fieldStyles.label}>
            Date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            max={new Date().toISOString().slice(0, 10)}
            className={`${fieldStyles.control} ${fieldStyles.monoControl}`}
          />
          <span className={fieldStyles.hint}>Defaults to today</span>
        </div>
      </div>

      <div className={fieldStyles.field}>
        <label htmlFor="sourceUrl" className={fieldStyles.label}>
          Source link
        </label>
        <input
          id="sourceUrl"
          name="sourceUrl"
          type="url"
          inputMode="url"
          placeholder="https://"
          className={`${fieldStyles.control} ${fieldStyles.monoControl}`}
        />
        <span className={fieldStyles.hint}>Kept so you can reopen the original posting later</span>
      </div>

      <div className={fieldStyles.field}>
        <label htmlFor="jobDescription" className={fieldStyles.label}>
          Job description
        </label>
        <textarea
          id="jobDescription"
          name="jobDescription"
          rows={10}
          className={`${fieldStyles.control} ${fieldStyles.textarea}`}
        />
        <span className={fieldStyles.hint}>Optional now; the tailoring step will read it later</span>
      </div>

      <div className={styles.footer}>
        <Link href="/" className={buttonStyles.button.ghost}>
          Cancel
        </Link>
        <button
          type="submit"
          disabled={pending}
          className={`${buttonStyles.button.primary} ${buttonStyles.large}`}
        >
          {pending ? 'Saving…' : 'Save'}
          <span className={srOnly}> application</span>
        </button>
      </div>
    </form>
  )
}
