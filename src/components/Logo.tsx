import { vars } from '@/app/theme.css'

/**
 * Two pages: the CV behind, its tailored copy in front in the accent. The
 * back page takes the text colour, so it follows the theme; the front page's
 * lines take accentInk, the colour already defined to sit on the accent.
 */
export function Logo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden focusable="false">
      <rect x="4" y="3" width="16.5" height="21" rx="2.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <rect x="11.5" y="8" width="16.5" height="21" rx="2.5" style={{ fill: vars.color.accent }} />
      <path
        d="M15.5 15h8.5M15.5 19.2h8.5M15.5 23.4h5.5"
        strokeWidth="2"
        strokeLinecap="round"
        style={{ stroke: vars.color.accentInk }}
      />
    </svg>
  )
}
