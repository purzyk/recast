import Link from 'next/link'
import * as screen from '@/components/screen.css'
import * as styles from '../page.css'
import { AppBar } from '@/components/AppBar'
import { ExperienceEntryForm } from '@/components/ExperienceEntryForm'

export const dynamic = 'force-dynamic'

export default function NewExperienceEntryPage() {
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
      <ExperienceEntryForm />
    </div>
  )
}
