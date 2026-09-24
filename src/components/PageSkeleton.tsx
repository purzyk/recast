import * as screen from './screen.css'
import * as styles from './skeleton.css'
import { AppBar } from './AppBar'
import { srOnly } from '@/styles/utils.css'

const WIDTHS = ['92%', '78%', '85%', '64%', '88%', '71%']

/**
 * Every data screen's loading.tsx. The app bar is real, so navigation never
 * shifts; the rest is placeholder bars in the header and body positions.
 */
export default function PageSkeleton() {
  return (
    <div className={styles.shell} aria-busy="true">
      <AppBar />
      <header className={screen.header}>
        <div>
          <div className={styles.title} />
          <div className={styles.subtitle} />
        </div>
      </header>
      <div className={styles.body}>
        <span className={srOnly} role="status">
          Loading
        </span>
        {WIDTHS.map((width, index) => (
          <div key={index} className={styles.bar} style={{ width }} />
        ))}
      </div>
    </div>
  )
}
