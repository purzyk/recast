import { style } from '@vanilla-extract/css'
import { bp, sys, vars } from '@/app/theme.css'

export const shell = style({
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  background: vars.color.bg,
  color: vars.color.text,
})

/** A single column, capped: a job description in a 1400px-wide textarea is
 *  unreadable, and nothing else on this screen wants the room either. */
export const form = style({
  width: '100%',
  maxWidth: '680px',
  margin: '0 auto',
  padding: `${sys.space.s5} ${sys.space.s5} ${sys.space.s6}`,
  display: 'flex',
  flexDirection: 'column',
  gap: sys.space.s4,
})

export const sectionLabel = style({
  display: 'flex',
  alignItems: 'center',
  gap: sys.space.s2,
  margin: 0,
  fontFamily: sys.font.mono,
  fontSize: sys.fontSize.micro,
  letterSpacing: '0.09em',
  textTransform: 'uppercase',
  color: vars.color.muted,
  '::after': { content: '""', flex: 1, height: '1px', background: vars.color.border },
})

export const row = style({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: sys.space.s4,
  '@media': { [bp.laptop]: { gridTemplateColumns: '1fr' } },
})

export const footer = style({
  display: 'flex',
  alignItems: 'center',
  gap: sys.space.s2,
  paddingTop: sys.space.s3,
  borderTop: `${sys.border.width} solid ${vars.color.border}`,
})
