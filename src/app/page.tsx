import * as styles from './page.css'

// Note: no 'use client'. This stays a Server Component — the styles compiled
// to a static stylesheet at build time, so nothing ships to the browser to
// make them work.
export default function HomePage() {
  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <h1 className={styles.title}>Recast</h1>
        <p className={styles.note}>Skeleton is live.</p>
      </div>
    </main>
  )
}
