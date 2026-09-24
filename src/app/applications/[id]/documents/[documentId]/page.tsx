import Link from 'next/link'
import { notFound } from 'next/navigation'
import * as screen from '@/components/screen.css'
import * as buttonStyles from '@/components/button.css'
import * as styles from '@/components/tailoring.css'
import { AppBar } from '@/components/AppBar'
import { TailorSteps } from '@/components/TailorSteps'
import { DocumentBlockView } from '@/components/DocumentBlockView'
import { CopyDocument } from '@/components/CopyDocument'
import { DOCUMENT_LABEL, getDocument, getDocuments, toPlainText } from '@/lib/documents'
import { highlight } from '@/lib/highlight'
import { deleteDocument } from '../../actions'

export const dynamic = 'force-dynamic'

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
const numberFormat = new Intl.NumberFormat('en-GB')

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string; documentId: string }>
}) {
  const { id: rawId, documentId: rawDocumentId } = await params
  const applicationId = Number(rawId)
  const documentId = Number(rawDocumentId)
  if (!Number.isInteger(documentId) || documentId <= 0) notFound()

  const document = await getDocument(documentId)
  if (!document || document.applicationId !== applicationId) notFound()

  const siblings = (await getDocuments(applicationId)).filter((other) => other.kind === document.kind)
  const { blocks, requirements } = document.content
  const matched = requirements.filter((requirement) => requirement.sources.length > 0)
  const unmatched = requirements.filter((requirement) => requirement.sources.length === 0)
  const label = DOCUMENT_LABEL[document.kind]
  const printHref = `/applications/${applicationId}/documents/${document.id}/print`

  const segments = highlight(
    document.jobDescription ?? '',
    matched.map((requirement) => requirement.phrase),
  )

  return (
    <div className={styles.shell}>
      <AppBar />

      <header className={screen.header}>
        <div>
          <p className={screen.crumb}>
            <Link href="/">Board</Link> / <Link href={`/applications/${applicationId}`}>{document.company}</Link> /{' '}
            {label} v{document.version}
          </p>
          <h1 className={screen.title}>
            {label} for {document.company}
          </h1>
          <p className={screen.subtitle}>{document.role}</p>
        </div>
        <div className={screen.headerActions}>
          <TailorSteps current="Review" />
        </div>
      </header>

      <div className={`${screen.body} ${styles.twoPane}`}>
        <section className={screen.pane}>
          <h2 className={screen.paneLabel}>Source — matched phrases underlined</h2>
          <p className={styles.posting}>
            {segments.map((segment, index) =>
              segment.matched ? (
                <mark key={index} className={screen.matched} style={{ background: 'none' }}>
                  {segment.text}
                </mark>
              ) : (
                segment.text
              ),
            )}
          </p>
          {requirements.length > 0 && (
            <p className={styles.note}>
              {matched.length} of {requirements.length} requirements matched to an experience entry.
              {unmatched.length > 0 && (
                <>
                  {' '}
                  {unmatched.length} unmatched:{' '}
                  <span className={styles.unmatched}>
                    {unmatched.map((requirement) => requirement.phrase).join(', ')}
                  </span>
                  .
                </>
              )}
            </p>
          )}
        </section>

        <section className={screen.pane}>
          <h2 className={screen.paneLabel}>
            Output — {label}, v{document.version}
          </h2>
          {blocks.map((block) => (
            <DocumentBlockView
              key={block.id}
              documentId={document.id}
              block={block}
              sourceTitles={block.sources.flatMap((id) => document.entryTitles.get(id) ?? [])}
            />
          ))}

          <p className={styles.meta}>
            Generated {dateFormat.format(document.createdAt)} by {document.model} ·{' '}
            {numberFormat.format(document.inputTokens)} tokens in, {numberFormat.format(document.outputTokens)} out
            {document.edited && <> · edited since</>}
          </p>

          {siblings.length > 1 && (
            <nav className={styles.versions} aria-label={`${label} versions`}>
              {siblings.map((sibling) =>
                sibling.id === document.id ? (
                  <span key={sibling.id} aria-current="page">
                    v{sibling.version}
                  </span>
                ) : (
                  <Link key={sibling.id} href={`/applications/${applicationId}/documents/${sibling.id}`}>
                    v{sibling.version}
                  </Link>
                ),
              )}
            </nav>
          )}
        </section>
      </div>

      <footer className={screen.footer}>
        <form action={deleteDocument}>
          <input type="hidden" name="documentId" value={document.id} />
          <button type="submit" className={buttonStyles.button.ghost}>
            Delete this version
          </button>
        </form>
        <div className={screen.footerRight}>
          <CopyDocument text={toPlainText(document.content, document.kind)} />
          <Link href={`/applications/${applicationId}/tailor`} className={buttonStyles.button.secondary}>
            Generate another version
          </Link>
          {/* Plain anchors: these are standalone HTML pages, not app routes. */}
          <a href={`${printHref}`} target="_blank" rel="noopener" className={buttonStyles.button.secondary}>
            Preview
          </a>
          <a
            href={`${printHref}?print`}
            target="_blank"
            rel="noopener"
            className={`${buttonStyles.button.primary} ${buttonStyles.large}`}
          >
            Download PDF
          </a>
        </div>
      </footer>
    </div>
  )
}
