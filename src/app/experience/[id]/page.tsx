import Link from 'next/link'
import { notFound } from 'next/navigation'
import * as screen from '@/components/screen.css'
import * as styles from '../page.css'
import { AppBar } from '@/components/AppBar'
import { ExperienceEntryForm } from '@/components/ExperienceEntryForm'
import { getEntry, KIND_LABEL_ONE } from '@/lib/experience'

export const dynamic = 'force-dynamic'

export default async function EditExperienceEntryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: rawId } = await params
  const id = Number(rawId)
  if (!Number.isInteger(id) || id <= 0) notFound()

  const entry = await getEntry(id)
  if (!entry) notFound()

  return (
    <div className={styles.shell}>
      <AppBar />
      <header className={screen.header}>
        <div>
          <p className={screen.crumb}>
            <Link href="/experience">Experience library</Link> / {KIND_LABEL_ONE[entry.kind]}
          </p>
          <h1 className={screen.title}>{entry.title}</h1>
        </div>
      </header>
      <ExperienceEntryForm entry={entry} />
    </div>
  )
}
