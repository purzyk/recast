import Link from 'next/link'
import { notFound } from 'next/navigation'
import * as screen from '@/components/screen.css'
import * as buttonStyles from '@/components/button.css'
import * as fieldStyles from '@/components/field.css'
import * as styles from '@/components/tailoring.css'
import { srOnly } from '@/styles/utils.css'
import { AppBar } from '@/components/AppBar'
import { TailorSteps } from '@/components/TailorSteps'
import { TailorRunner } from '@/components/TailorRunner'
import { getApplication } from '@/lib/application-detail'
import { getDocuments, type DocumentKind } from '@/lib/documents'
import { db } from '@/lib/db'
import { saveJobDescription } from '../actions'

export const dynamic = 'force-dynamic'

export default async function TailorPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id)
  if (!Number.isInteger(id) || id <= 0) notFound()

  const [application, documents, entryCount] = await Promise.all([
    getApplication(id),
    getDocuments(id),
    db.experienceEntry.count(),
  ])
  if (!application) notFound()

  const nextVersion = (kind: DocumentKind) =>
    Math.max(0, ...documents.filter((document) => document.kind === kind).map((document) => document.version)) + 1

  const hasPosting = Boolean(application.jobDescription?.trim())

  return (
    <div className={styles.shell}>
      <AppBar />

      <header className={screen.header}>
        <div>
          <p className={screen.crumb}>
            <Link href="/">Board</Link> / <Link href={`/applications/${id}`}>{application.company}</Link> / Tailoring
          </p>
          <h1 className={screen.title}>Tailoring for {application.company}</h1>
          <p className={screen.subtitle}>{application.role}</p>
        </div>
        <div className={screen.headerActions}>
          <TailorSteps current={hasPosting ? 'Generate' : 'Source'} />
        </div>
      </header>

      <div className={`${screen.body} ${styles.twoPane}`}>
        <section className={screen.pane}>
          <h2 className={screen.paneLabel}>Source — job description</h2>
          {hasPosting ? (
            <p className={styles.posting}>{application.jobDescription}</p>
          ) : (
            <form action={saveJobDescription} className={styles.outputForm}>
              <input type="hidden" name="id" value={id} />
              <label htmlFor="jobDescription" className={srOnly}>
                Job description
              </label>
              <textarea
                id="jobDescription"
                name="jobDescription"
                rows={18}
                required
                placeholder="Paste the posting. Tailoring reads this and nothing else about the role."
                className={`${fieldStyles.control} ${fieldStyles.textarea}`}
              />
              <button type="submit" className={buttonStyles.button.secondary} style={{ alignSelf: 'flex-start' }}>
                Save the posting
              </button>
            </form>
          )}
        </section>

        <section className={screen.pane}>
          <h2 className={screen.paneLabel}>Output</h2>
          <TailorRunner
            applicationId={id}
            company={application.company}
            entryCount={entryCount}
            nextVersion={{ cv: nextVersion('cv'), coverLetter: nextVersion('coverLetter') }}
            disabled={!hasPosting || entryCount === 0}
          />
          <p className={styles.note}>
            {entryCount === 0 ? (
              <>
                The <Link href="/experience">experience library</Link> is empty. Tailoring can only draw on what is
                in it.
              </>
            ) : (
              <>
                Draws only on the {entryCount} entries in the <Link href="/experience">experience library</Link>.
                Every block names the entries it used. Generating always adds a new version and never overwrites
                one you already have.
              </>
            )}
          </p>
        </section>
      </div>
    </div>
  )
}
