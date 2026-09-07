import * as screen from '@/components/screen.css'
import * as styles from './page.css'
import { AppBar } from '@/components/AppBar'
import { NewApplicationForm } from '@/components/NewApplicationForm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function NewApplicationPage() {
  return (
    <div className={styles.shell}>
      <AppBar />
      <header className={screen.header}>
        <div>
          <p className={screen.crumb}>
            <Link href="/">Board</Link> / New application
          </p>
          <h1 className={screen.title}>New application</h1>
        </div>
      </header>
      <NewApplicationForm />
    </div>
  )
}
