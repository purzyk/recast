import Link from 'next/link'
import { notFound } from 'next/navigation'
import * as screen from '@/components/screen.css'
import * as buttonStyles from '@/components/button.css'
import * as fieldStyles from '@/components/field.css'
import * as pageStyles from './page.css'
import { statusTone } from '@/styles/status.css'
import { srOnly, tabular } from '@/styles/utils.css'
import { AppBar } from '@/components/AppBar'
import { StatusBadge } from '@/components/StatusBadge'
import { StatusGlyph } from '@/components/StatusGlyph'
import { MoveStatus } from '@/components/MoveStatus'
import { DeleteApplication } from '@/components/DeleteApplication'
import { getApplication, chaseHint } from '@/lib/application-detail'
import { STATUS_LABEL } from '@/lib/status'
import { elapsed } from '@/lib/elapsed'
import { DOCUMENT_LABEL, getDocuments } from '@/lib/documents'
import * as table from '@/components/dataTable.css'
import { addNote } from './actions'

export const dynamic = 'force-dynamic'

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' })

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: rawId } = await params
  const id = Number(rawId)
  if (!Number.isInteger(id) || id <= 0) notFound()

  const [application, documents] = await Promise.all([getApplication(id), getDocuments(id)])
  if (!application) notFound()

  const hint = chaseHint(application.status, application.since)
  const applied = application.history.find((entry) => entry.status === 'applied')

  return (
    <div className={pageStyles.shell}>
      <AppBar />

      <header className={screen.header}>
        <div>
          <p className={screen.crumb}>
            <Link href="/" style={{ color: 'inherit' }}>
              Board
            </Link>{' '}
            / {application.company}
          </p>
          <h1 className={screen.title}>{application.company}</h1>
          <p className={screen.subtitle}>{application.role}</p>
        </div>
        <div className={screen.headerActions}>
          <StatusBadge status={application.status} large />
          <MoveStatus id={application.id} status={application.status} />
          <DeleteApplication id={application.id} company={application.company} />
        </div>
      </header>

      <div className={`${screen.body} ${pageStyles.panes}`}>
        {/* ---- left: the record ---- */}
        <section className={screen.pane}>
          <h2 className={screen.paneLabel}>Record</h2>
          <dl className={pageStyles.record}>
            <dt className={pageStyles.recordKey}>Status</dt>
            <dd className={pageStyles.recordValue}>
              {STATUS_LABEL[application.status]} · <span className={tabular}>{elapsed(application.since)}</span>
            </dd>

            {applied && (
              <>
                <dt className={pageStyles.recordKey}>Applied</dt>
                <dd className={`${pageStyles.recordValue} ${tabular}`}>{dateFormat.format(applied.at)}</dd>
              </>
            )}

            <dt className={pageStyles.recordKey}>Last contact</dt>
            <dd className={`${pageStyles.recordValue} ${tabular}`}>
              {application.lastContactAt ? dateFormat.format(application.lastContactAt) : '—'}
            </dd>

            <dt className={pageStyles.recordKey}>Posting</dt>
            <dd className={pageStyles.recordValue}>
              {application.sourceUrl ? (
                <a href={application.sourceUrl} target="_blank" rel="noreferrer noopener">
                  {new URL(application.sourceUrl).hostname}
                  <span className={srOnly}> (opens in a new tab)</span>
                </a>
              ) : (
                '—'
              )}
            </dd>
          </dl>

          {hint && <p className={pageStyles.hint}>{hint}</p>}

          <h2 className={screen.paneLabel} style={{ marginTop: 24 }}>
            Status history
          </h2>
          <ol className={screen.history}>
            {application.history.map((entry) => (
              <li key={entry.id} className={`${screen.historyItem} ${statusTone[entry.status]}`}>
                <span className={screen.historyGlyph}>
                  <StatusGlyph status={entry.status} size={12} />
                </span>
                <span>{STATUS_LABEL[entry.status]}</span>
                <span className={screen.historyDate}>{dateFormat.format(entry.at)}</span>
              </li>
            ))}
            {application.history.length === 0 && <li className={screen.prose}>No status changes recorded yet.</li>}
          </ol>

          {application.jobDescription && (
            <>
              <h2 className={screen.paneLabel} style={{ marginTop: 24 }}>
                Job description
              </h2>
              <p className={screen.prose}>{application.jobDescription}</p>
            </>
          )}
        </section>

        {/* ---- right: notes ---- */}
        <section className={screen.pane}>
          <h2 className={screen.paneLabel}>Notes</h2>

          {application.notes.map((note) => (
            <p key={note.id} className={screen.prose}>
              {note.body}
              <span className={pageStyles.noteDate}> — {dateFormat.format(note.createdAt)}</span>
            </p>
          ))}
          {application.notes.length === 0 && (
            <p className={screen.prose}>Nothing noted yet.</p>
          )}

          <form action={addNote} className={pageStyles.noteForm}>
            <input type="hidden" name="id" value={application.id} />
            <label htmlFor="note-body" className={srOnly}>
              Add a note
            </label>
            <textarea
              id="note-body"
              name="body"
              rows={3}
              placeholder="Referred by nobody — cold application through the careers page."
              className={`${fieldStyles.control} ${fieldStyles.textarea}`}
            />
            <button type="submit" className={buttonStyles.button.secondary}>
              Add a note
            </button>
          </form>
        </section>

        {/* ---- documents ---- */}
        <section className={screen.pane}>
          <h2 className={screen.paneLabel}>Documents</h2>

          {documents.length > 0 ? (
            <table className={`${table.table} ${pageStyles.documentTable}`}>
              <tbody>
                {documents.map((document) => (
                  <tr key={document.id} className={table.row}>
                    <td className={table.td}>
                      <Link href={`/applications/${application.id}/documents/${document.id}`}>
                        <span className={table.primaryCell}>{DOCUMENT_LABEL[document.kind]}</span>
                      </Link>{' '}
                      <span className={table.dimCell}>v{document.version}</span>
                    </td>
                    <td className={`${table.td} ${table.num}`}>
                      {document.edited ? `edited ${elapsed(document.updatedAt)}` : dateFormat.format(document.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className={screen.prose}>Nothing tailored for this application yet.</p>
          )}

          <Link
            href={`/applications/${application.id}/tailor`}
            className={`${buttonStyles.button.primary} ${buttonStyles.large}`}
            style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}
          >
            Open tailoring
          </Link>
          <p className={pageStyles.tailorHint}>
            {documents.length > 0 ? 'Generates a new version, never overwrites one' : 'Drafts a CV or cover letter from the experience library'}
          </p>
        </section>
      </div>
    </div>
  )
}
