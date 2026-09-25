'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import * as styles from './appBar.css'
import * as buttonStyles from './button.css'

/**
 * The app bar's nav at phone width: a Menu button and a panel under the bar.
 * The panel's contents are server-rendered children (sign-out is a server
 * action), so this only owns open and closed.
 *
 * Open is remembered as the path it was opened on, so following a link in
 * the panel closes it without an effect watching the route.
 */
export function MobileMenu({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [openOn, setOpenOn] = useState<string | null>(null)
  const open = openOn === pathname
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = () => setOpenOn(null)
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && close()
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) close()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  return (
    <div ref={root} className={styles.mobileMenu}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="app-menu"
        onClick={() => setOpenOn(open ? null : pathname)}
        className={buttonStyles.button.ghost}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden focusable="false">
          {open ? (
            <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          ) : (
            <path d="M2 4h10M2 7h10M2 10h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          )}
        </svg>
        Menu
      </button>
      <div id="app-menu" hidden={!open} className={styles.menuPanel}>
        {children}
      </div>
    </div>
  )
}
