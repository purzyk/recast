/**
 * A job posting read back into headings, bullets, prose and technology tags
 * (lib/posting.ts). Muted like every other secondary text; only headings and
 * matched phrases step up to the text colour.
 */
import { style } from '@vanilla-extract/css'
import { sys, vars } from '../app/theme.css'

export const posting = style({
  fontSize: sys.fontSize.small,
  lineHeight: 1.6,
  color: vars.color.muted,
})

export const heading = style({
  margin: `${sys.space.s5} 0 ${sys.space.s1}`,
  fontSize: sys.fontSize.body,
  fontWeight: 600,
  lineHeight: 1.4,
  color: vars.color.text,
  selectors: { '&:first-child': { marginTop: 0 } },
})

export const paragraph = style({
  margin: `0 0 ${sys.space.s2}`,
})

export const list = style({
  margin: `0 0 ${sys.space.s2}`,
  padding: 0,
  listStyle: 'none',
})

export const item = style({
  position: 'relative',
  paddingLeft: sys.space.s4,
  selectors: {
    '& + &': { marginTop: '3px' },
    '&::before': {
      content: '"–"',
      position: 'absolute',
      left: 0,
      color: vars.color.borderStrong,
    },
  },
})

export const tags = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: sys.space.s1,
  margin: `${sys.space.s1} 0 ${sys.space.s3}`,
})

export const tagLabel = style({
  marginRight: sys.space.s1,
  fontFamily: sys.font.mono,
  fontSize: sys.fontSize.micro,
  letterSpacing: '0.09em',
  textTransform: 'uppercase',
  color: vars.color.muted,
})

export const tag = style({
  padding: `1px ${sys.space.s2}`,
  border: `${sys.border.width} solid ${vars.color.border}`,
  borderRadius: sys.radius.sm,
  background: vars.color.surface,
  fontFamily: sys.font.mono,
  fontSize: sys.fontSize.meta,
  lineHeight: 1.6,
  color: vars.color.text,
  whiteSpace: 'nowrap',
})
