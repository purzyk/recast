import Link from 'next/link'
import * as screen from '@/components/screen.css'
import * as styles from '../page.css'
import { AppBar } from '@/components/AppBar'
import { ExperienceEntryForm } from '@/components/ExperienceEntryForm'
import { getEntries } from '@/lib/experience'

export const dynamic = 'force-dynamic'

export default async function NewExperienceEntryPage() {
  const jobs = await getEntries('work')
  return (
    <div className={styles.shell}>
      <AppBar />
      <header className={screen.header}>
        <div>
          <p className={screen.crumb}>
            <Link href="/experience">Experience library</Link> / New entry
          </p>
          <h1 className={screen.title}>New entry</h1>
        </div>
      </header>
      <ExperienceEntryForm jobs={jobs} />
    </div>
  )
}
