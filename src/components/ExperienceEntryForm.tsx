import Link from 'next/link'
import * as fieldStyles from './field.css'
import * as buttonStyles from './button.css'
import * as styles from '@/app/applications/new/page.css'
import { createEntry, updateEntry } from '@/app/experience/actions'
import { DeleteEntry } from './DeleteEntry'
import { EXPERIENCE_KINDS, KIND_LABEL_ONE, type ExperienceEntryRow } from '@/lib/experience'

/**
 * One form, both jobs. An edit is a create with an id and a delete button —
 * splitting them would duplicate every field for no gain.
 */
export function ExperienceEntryForm({ entry }: { entry?: ExperienceEntryRow }) {
  const editing = Boolean(entry)

  return (
    <form action={editing ? updateEntry : createEntry} className={styles.form}>
      {entry && <input type="hidden" name="id" value={entry.id} />}

      <h2 className={styles.sectionLabel}>The entry</h2>

      <div className={fieldStyles.field}>
        <label htmlFor="title" className={fieldStyles.label}>
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={entry?.title}
          autoComplete="off"
          className={fieldStyles.control}
        />
      </div>

      <div className={styles.row}>
        <div className={fieldStyles.field}>
          <label htmlFor="kind" className={fieldStyles.label}>
            Kind
          </label>
          <div className={fieldStyles.selectWrap}>
            <select
              id="kind"
              name="kind"
              defaultValue={entry?.kind ?? 'work'}
              className={`${fieldStyles.control} ${fieldStyles.select}`}
            >
              {EXPERIENCE_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {KIND_LABEL_ONE[kind]}
                </option>
              ))}
            </select>
            <span className={fieldStyles.caret} aria-hidden>
              <svg width={10} height={10} viewBox="0 0 10 10" focusable="false">
                <path d="M2 4 5 7 8 4" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" />
              </svg>
            </span>
          </div>
        </div>

        <div className={fieldStyles.field}>
          <label htmlFor="period" className={fieldStyles.label}>
            Dates
          </label>
          <input
            id="period"
            name="period"
            defaultValue={entry?.period ?? ''}
            placeholder="2018 – present"
            autoComplete="off"
            className={`${fieldStyles.control} ${fieldStyles.monoControl}`}
          />
          {/* Free text on purpose: "2018 – present" and the dash a skill
              carries are both unrepresentable as two dates. */}
          <span className={fieldStyles.hint}>Free text — leave blank for skills</span>
        </div>
      </div>

      <div className={fieldStyles.field}>
        <label htmlFor="body" className={fieldStyles.label}>
          Body
        </label>
        <textarea
          id="body"
          name="body"
          required
          rows={10}
          defaultValue={entry?.body}
          className={`${fieldStyles.control} ${fieldStyles.textarea}`}
        />
        <span className={fieldStyles.hint}>
          What a tailored CV should be able to draw from. Write it as you would want it read.
        </span>
      </div>

      <div className={styles.footer}>
        <Link href="/experience" className={buttonStyles.button.ghost}>
          Cancel
        </Link>
        <button type="submit" className={`${buttonStyles.button.primary} ${buttonStyles.large}`}>
          {editing ? 'Save changes' : 'Add entry'}
        </button>
        {entry && (
          <span style={{ marginLeft: 'auto' }}>
            <DeleteEntry id={entry.id} title={entry.title} />
          </span>
        )}
      </div>
    </form>
  )
}
