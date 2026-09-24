/**
 * The shape of a screen before its data arrives: shown on navigation while
 * the server renders, and all that link prefetching fetches ahead of time.
 */
import { keyframes, style } from '@vanilla-extract/css'
import { sys, vars } from '../app/theme.css'

const pulse = keyframes({
  '0%, 100%': { opacity: 0.55 },
  '50%': { opacity: 1 },
})

export const shell = style({
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  background: vars.color.bg,
  color: vars.color.text,
})

export const body = style({
  display: 'flex',
  flexDirection: 'column',
  gap: sys.space.s3,
  padding: `${sys.space.s4} ${sys.space.s5}`,
})

export const bar = style({
  height: '12px',
  borderRadius: sys.radius.sm,
  background: vars.color.surfaceHi,
  animation: `${pulse} 1.4s ease-in-out infinite`,
  '@media': { '(prefers-reduced-motion: reduce)': { animation: 'none' } },
})

export const title = style([bar, { height: '22px', width: '240px' }])
export const subtitle = style([bar, { width: '160px', marginTop: sys.space.s2 }])
