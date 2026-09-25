'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as styles from './appBar.css'
import * as buttonStyles from './button.css'

const LINKS = [
  { href: '/', label: 'Board' },
  { href: '/companies', label: 'Companies' },
  { href: '/experience', label: 'Experience' },
]

/** An existing application's screens count as the board: that is where you
 *  reach them from. The new-application form belongs to no section — it is
 *  the primary action, not a place — so nothing is lit there. */
function isActive(href: string, pathname: string): boolean {
  if (href === '/') return pathname === '/' || /^\/applications\/\d+/.test(pathname)
  return pathname === href || pathname.startsWith(`${href}/`)
}

/** `bar` sits in the app bar; `menu` is the full-width rows of the phone menu. */
export function NavLinks({ variant = 'bar' }: { variant?: 'bar' | 'menu' }) {
  const pathname = usePathname()
  return (
    <>
      {LINKS.map((link) => {
        const active = isActive(link.href, pathname)
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={[
              buttonStyles.button.ghost,
              variant === 'menu' && styles.menuItem,
              active && (variant === 'menu' ? styles.menuActive : styles.navActive),
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {link.label}
          </Link>
        )
      })}
    </>
  )
}
