import Link from 'next/link'
import * as screen from '@/components/screen.css'
import * as styles from '@/components/tailoring.css'
import { AppBar } from '@/components/AppBar'
import { ImportRunner } from '@/components/ImportRunner'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function ImportPage() {
  const [existing, profile] = await Promise.all([db.experienceEntry.count(), db.profile.findUnique({ where: { id: 1 } })])

  return (
    <div className={styles.shell}>
      <AppBar />
      <header className={screen.header}>
        <div>
          <p className={screen.crumb}>
            <Link href="/">Board</Link> / <Link href="/experience">Experience library</Link> / Import
          </p>
          <h1 className={screen.title}>Import from CV</h1>
          <p className={screen.subtitle}>An existing CV, turned into the library tailoring draws from</p>
        </div>
      </header>
      <ImportRunner existing={existing} hasProfile={Boolean(profile)} />
    </div>
  )
}
