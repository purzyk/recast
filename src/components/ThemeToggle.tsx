'use client'

import * as buttonStyles from './button.css'
import * as styles from './themeToggle.css'
import { srOnly } from '@/styles/utils.css'
import { THEME_STORAGE_KEY, themeClass, type Theme } from '@/lib/theme'

/**
 * Both labels render on the server and CSS shows the one that matches the
 * class the pre-hydration script put on <html>. Waiting for a mount to learn
 * the theme would render nothing first, and since every screen mounts its
 * own app bar, the nav would jump sideways on every navigation.
 */
export function ThemeToggle({ className = buttonStyles.button.ghost }: { className?: string }) {
  function toggle() {
    const root = document.documentElement
    const current: Theme = root.classList.contains(themeClass.light) ? 'light' : 'dark'
    const next: Theme = current === 'dark' ? 'light' : 'dark'
    root.classList.remove(themeClass[current])
    root.classList.add(themeClass[next])
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // Private mode, or storage disabled. The toggle still works for this
      // page view; it just will not be remembered.
    }
  }

  return (
    <button type="button" onClick={toggle} className={className}>
      <span className={styles.whenDark}>
        <span aria-hidden>Light</span>
        <span className={srOnly}>Switch to light theme</span>
      </span>
      <span className={styles.whenLight}>
        <span aria-hidden>Dark</span>
        <span className={srOnly}>Switch to dark theme</span>
      </span>
    </button>
  )
}
