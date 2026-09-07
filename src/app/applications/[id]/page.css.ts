import { style } from '@vanilla-extract/css'
import { bp, sys, vars } from '@/app/theme.css'

export const shell = style({
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  background: vars.color.bg,
  color: vars.color.text,
})

/** Record and history on the left, notes on the right. Stacks below laptop —
 *  two narrow columns of prose is worse than one wide one. */
export const twoPane = style({
  gridTemplateColumns: '1fr 1fr',
  '@media': {
    [bp.laptop]: { gridTemplateColumns: '1fr' },
  },
})

export const record = style({
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  gap: `${sys.space.s1} ${sys.space.s3}`,
  margin: 0,
})

export const recordKey = style({
  fontFamily: sys.font.mono,
  fontSize: sys.fontSize.meta,
  color: vars.color.muted,
})

export const recordValue = style({
  margin: 0,
  fontSize: sys.fontSize.body,
})

/** The nudge: how long this has sat, and when it stops being patience. */
export const hint = style({
  margin: `${sys.space.s3} 0 0`,
  padding: `${sys.space.s2} ${sys.space.s3}`,
  borderLeft: `2px solid ${vars.color.accent}`,
  background: vars.color.surface,
  fontSize: sys.fontSize.small,
  color: vars.color.muted,
})

export const noteDate = style({
  fontFamily: sys.font.mono,
  fontSize: sys.fontSize.micro,
  color: vars.color.muted,
})

export const noteForm = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: sys.space.s2,
  marginTop: sys.space.s3,
})
