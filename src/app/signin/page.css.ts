import { style } from '@vanilla-extract/css'
import { sys, vars } from '@/app/theme.css'

export const shell = style({
  minHeight: '100vh',
  display: 'grid',
  placeItems: 'center',
  padding: sys.space.s5,
  background: vars.color.bg,
  color: vars.color.text,
})

export const panel = style({
  width: '100%',
  maxWidth: '360px',
  display: 'flex',
  flexDirection: 'column',
  gap: sys.space.s4,
  padding: sys.space.s5,
  background: vars.color.surface,
  border: `${sys.border.width} solid ${vars.color.border}`,
  borderRadius: sys.radius.md,
})

export const wordmark = style({
  margin: 0,
  fontSize: sys.fontSize.h1,
  fontWeight: 600,
  letterSpacing: '-0.02em',
})

export const blurb = style({
  margin: 0,
  fontSize: sys.fontSize.small,
  lineHeight: 1.5,
  color: vars.color.muted,
})

export const note = style({
  margin: 0,
  fontFamily: sys.font.mono,
  fontSize: sys.fontSize.micro,
  letterSpacing: '0.06em',
  color: vars.color.muted,
})

export const error = style({
  margin: 0,
  padding: sys.space.s2,
  borderLeft: `2px solid ${vars.color.danger}`,
  fontSize: sys.fontSize.small,
  color: vars.color.text,
})
