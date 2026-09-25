import Link from 'next/link'
import * as styles from './appBar.css'
import * as buttonStyles from './button.css'
import { ThemeToggle } from './ThemeToggle'
import { SignOut } from './SignOut'
import { NavLinks } from './NavLinks'
import { MobileMenu } from './MobileMenu'
import { Logo } from './Logo'

/**
 * 52px, identical on every screen, so navigation never shifts.
 *
 * The nav links are an addition to the design: the mockups reach Companies
 * and the Experience library only through breadcrumbs, which left both
 * screens unreachable. Ghost treatment keeps them quieter than the one
 * primary action.
 *
 * "Add application" is outlined rather than filled: it is on every screen,
 * and a filled one here would sit above each screen's own primary action.
 */
export function AppBar({ tally }: { tally?: { tracked: number; open: number } }) {
  const menuItem = `${buttonStyles.button.ghost} ${styles.menuItem}`

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
        <div className={styles.desktopOnly}>
          <NavLinks />
          <span className={styles.divider} aria-hidden />
          <ThemeToggle />
          <SignOut />
        </div>
        <Link href="/applications/new" className={buttonStyles.button.accent} aria-label="Add application">
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden focusable="false">
            <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <span className={styles.longLabel}>Add application</span>
          <span className={styles.shortLabel}>Add</span>
        </Link>
        <MobileMenu>
          <NavLinks variant="menu" />
          <span className={styles.menuDivider} aria-hidden />
          <ThemeToggle className={menuItem} />
          <SignOut className={menuItem} />
        </MobileMenu>
      </nav>
    </header>
  )
}
