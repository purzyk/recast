'use client'

import { useEffect, useState } from 'react'
import * as buttonStyles from './button.css'
import { srOnly } from '@/styles/utils.css'
import { THEME_STORAGE_KEY, themeClass, type Theme } from '@/lib/theme'

/**
 * The pre-hydration script has already put the right class on <html>, so this
 * reads that rather than guessing — which also means no state mismatch
 * between server and client markup.
 *
 * Rendering null until mounted avoids claiming a theme the document may not
 * be in: the server cannot know what localStorage says.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null)

  useEffect(() => {
    const root = document.documentElement
    setTheme(root.classList.contains(themeClass.light) ? 'light' : 'dark')
  }, [])

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    const root = document.documentElement
    root.classList.remove(themeClass[theme === 'dark' ? 'dark' : 'light'])
    root.classList.add(themeClass[next])
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // Private mode, or storage disabled. The toggle still works for this
      // page view; it just will not be remembered.
    }
    setTheme(next)
  }

  // Reserve the space so the bar does not reflow when this appears.
  if (theme === null) return <span aria-hidden style={{ width: 28, height: 28 }} />

  return (
    <button type="button" onClick={toggle} className={buttonStyles.button.ghost}>
      {theme === 'dark' ? 'Light' : 'Dark'}
      <span className={srOnly}>Switch to {theme === 'dark' ? 'light' : 'dark'} theme</span>
    </button>
  )
}
