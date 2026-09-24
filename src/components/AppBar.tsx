import Link from 'next/link'
import * as styles from './appBar.css'
import * as buttonStyles from './button.css'
import { ThemeToggle } from './ThemeToggle'
import { SignOut } from './SignOut'
import { NavLinks } from './NavLinks'
import { Logo } from './Logo'

/**
 * 52px, identical on every screen, so navigation never shifts.
 *
 * The nav links are an addition to the design: the mockups reach Companies
 * and the Experience library only through breadcrumbs, which left both
 * screens unreachable. Ghost treatment keeps them quieter than the one
 * primary action.
 */
export function AppBar({ tally }: { tally?: { tracked: number; open: number } }) {
  return (
    <header className={styles.bar}>
      <Link href="/" className={styles.wordmark}>
        <Logo />
        Recast
      </Link>
      <span className={styles.divider} aria-hidden />
      {tally && (
        <span className={styles.tally}>
          {tally.tracked} tracked · {tally.open} open
        </span>
      )}

      <nav className={styles.right}>
        <NavLinks />
        <span className={styles.divider} aria-hidden />
        <ThemeToggle />
        <SignOut />
        <Link href="/applications/new" className={buttonStyles.button.primary}>
          Add application
        </Link>
      </nav>
    </header>
  )
}
