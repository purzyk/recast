import { style } from '@vanilla-extract/css'
import { bp, sys, vars } from '@/app/theme.css'

export const shell = style({
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  background: vars.color.bg,
  color: vars.color.text,
})

/** Rail beside the table, matching the design's 220px. Stacks on narrow —
 *  a 220px rail plus a five-column table does not fit a laptop. */
export const body = style({
  flex: 1,
  minHeight: 0,
  display: 'grid',
  gridTemplateColumns: '220px 1fr',
  '@media': { [bp.laptop]: { gridTemplateColumns: '1fr' } },
})

export const rail = style({
  padding: sys.space.s3,
  borderRight: `${sys.border.width} solid ${vars.color.border}`,
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  '@media': {
    [bp.laptop]: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      borderRight: 0,
      borderBottom: `${sys.border.width} solid ${vars.color.border}`,
    },
  },
})

export const railItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: sys.space.s2,
  padding: `6px ${sys.space.s2}`,
  borderRadius: sys.radius.sm,
  fontSize: sys.fontSize.small,
  color: vars.color.muted,
  textDecoration: 'none',
  selectors: {
    '&:hover': { background: vars.color.surfaceHi, color: vars.color.text },
  },
})

export const railItemActive = style({
  background: vars.color.surface,
  color: vars.color.text,
  fontWeight: 600,
})

export const railCount = style({
  marginLeft: 'auto',
  fontFamily: sys.font.mono,
  fontSize: sys.fontSize.meta,
  fontVariantNumeric: 'tabular-nums',
  color: vars.color.muted,
})

export const pane = style({
  minWidth: 0,
  padding: `${sys.space.s4} ${sys.space.s5}`,
  overflow: 'auto',
})

export const titleCell = style({ fontWeight: 600 })

/** The excerpt under an entry title: enough to tell two similar entries
 *  apart without opening either. */
export const excerpt = style({
  display: 'block',
  marginTop: '2px',
  fontSize: sys.fontSize.small,
  fontWeight: 400,
  color: vars.color.muted,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  maxWidth: '46ch',
})

export const footnote = style({
  marginTop: sys.space.s3,
  fontFamily: sys.font.mono,
  fontSize: sys.fontSize.micro,
  lineHeight: 1.6,
  color: vars.color.muted,
})

export const headerActions = style({
  marginLeft: 'auto',
  display: 'flex',
  alignItems: 'center',
  gap: sys.space.s2,
})
