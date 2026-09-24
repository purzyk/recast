import Link from 'next/link'
import * as screen from '@/components/screen.css'
import * as table from '@/components/dataTable.css'
import * as buttonStyles from '@/components/button.css'
import * as emptyStyles from '@/components/emptyState.css'
import * as styles from './page.css'
import { AppBar } from '@/components/AppBar'
import { elapsed } from '@/lib/elapsed'
import {
  getEntries,
  getKindCounts,
  getLastEdited,
  isExperienceKind,
  KIND_LABEL_ONE,
  EXPERIENCE_KINDS,
  periodEnd,
} from '@/lib/experience'

export const dynamic = 'force-dynamic'

/** The body as a one-line preview: no bullet dashes, no bold markers. */
function excerpt(body: string): string {
  return body
    .split('\n')
    .map((line) => line.replace(/^-\s+/, '').trim())
    .filter(Boolean)
    .join(' · ')
    .replace(/\*\*/g, '')
}

export default async function ExperiencePage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>
}) {
  const { kind: rawKind } = await searchParams
  const kind = rawKind && isExperienceKind(rawKind) ? rawKind : undefined

  const [entries, counts, lastEdited] = await Promise.all([
    getEntries(kind),
    getKindCounts(),
    getLastEdited(),
  ])

  const total = counts[0]?.count ?? 0

  // In the shape of the CV the library feeds: jobs newest first, each
  // followed by its projects; then standalone projects, skills, the rest.
  // A filtered view has no parents to nest under, so it stays flat.
  const titles = new Map(entries.map((entry) => [entry.id, entry.title]))
  const byEnd = (a: (typeof entries)[number], b: (typeof entries)[number]) => periodEnd(b.period) - periodEnd(a.period)
  const childrenOf = (id: number) => entries.filter((entry) => entry.parentId === id).sort(byEnd)
  const ordered = EXPERIENCE_KINDS.flatMap((type) =>
    entries
      .filter((entry) => entry.kind === type && !(entry.parentId && titles.has(entry.parentId)))
      .sort(type === 'skill' ? (a, b) => a.id - b.id : byEnd)
      .flatMap((entry) => {
        const children = childrenOf(entry.id)
        return [entry, ...children]
      }),
  )

  return (
    <div className={styles.shell}>
      <AppBar />

      <header className={screen.header}>
        <div>
          <p className={screen.crumb}>
            <Link href="/">Board</Link> / Experience library
          </p>
          <h1 className={screen.title}>Experience library</h1>
          <p className={screen.subtitle}>
            {total} {total === 1 ? 'entry' : 'entries'}
            {lastEdited && <> · last edited {elapsed(lastEdited)}</>}
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/experience/import" className={buttonStyles.button.secondary}>
            Import from CV
          </Link>
          <Link href="/experience/new" className={buttonStyles.button.primary}>
            Add entry
          </Link>
        </div>
      </header>

      <div className={styles.body}>
        <nav className={styles.rail} aria-label="Filter by kind">
          {counts.map((entry) => {
            const active = entry.kind === 'all' ? !kind : entry.kind === kind
            const href = entry.kind === 'all' ? '/experience' : `/experience?kind=${entry.kind}`
            return (
              <Link
                key={entry.kind}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`${styles.railItem} ${active ? styles.railItemActive : ''}`}
              >
                {entry.label}
                <span className={styles.railCount}>{entry.count}</span>
              </Link>
            )
          })}
        </nav>

        <div className={styles.pane}>
          {entries.length === 0 ? (
            <div className={emptyStyles.emptyState}>
              <p className={`${emptyStyles.line} ${emptyStyles.lead}`}>
                {total === 0 ? 'Nothing here yet' : 'Nothing of this kind yet'}
              </p>
              <p className={`${emptyStyles.line} ${emptyStyles.sub}`}>
                {total === 0
                  ? 'Add the work, projects and skills a tailored CV should draw from'
                  : 'Try another filter, or add an entry'}
              </p>
            </div>
          ) : (
            <>
              <table className={table.table}>
                <thead>
                  <tr>
                    <th className={table.th}>Entry</th>
                    <th className={table.th}>Type</th>
                    <th className={`${table.th} ${table.num}`}>Used in</th>
                    <th className={`${table.th} ${table.num}`}>Last edited</th>
                  </tr>
                </thead>
                <tbody>
                  {ordered.map((entry) => {
                    const parent = entry.parentId ? titles.get(entry.parentId) : undefined
                    const meta = [entry.period, parent && `part of ${parent}`].filter(Boolean).join(' · ')
                    return (
                      <tr key={entry.id} className={table.row}>
                        <td
                          className={`${table.td} ${styles.titleCell}`}
                        >
                          <Link href={`/experience/${entry.id}`}>{entry.title}</Link>
                          {meta && <span className={styles.entryMeta}>{meta}</span>}
                          <span className={styles.excerpt}>{excerpt(entry.body)}</span>
                        </td>
                        <td className={`${table.td} ${table.dimCell}`}>{KIND_LABEL_ONE[entry.kind]}</td>
                        <td className={`${table.td} ${table.num}`}>{entry.usedIn}</td>
                        <td className={`${table.td} ${table.num}`}>{elapsed(entry.updatedAt)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <p className={styles.footnote}>
                &ldquo;Used in&rdquo; counts the tailored documents an entry has fed. An entry
                sitting at zero either needs rewriting, or is a sign you are applying for the wrong
                jobs.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
