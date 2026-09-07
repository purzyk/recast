import { style } from '@vanilla-extract/css'
import { sys, vars } from '@/app/theme.css'

export const shell = style({
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  background: vars.color.bg,
  color: vars.color.text,
})

export const body = style({
  flex: 1,
  minHeight: 0,
  padding: `${sys.space.s4} ${sys.space.s5}`,
  overflow: 'auto',
})

/** The row that explains why this screen exists: a company with more than one
 *  application, one of them archived off the board. */
export const multiple = style({
  fontFamily: sys.font.mono,
  fontSize: sys.fontSize.meta,
  color: vars.color.accent,
})

export const nameCell = style({ fontWeight: 600 })

export const filters = style({ marginLeft: 'auto', display: 'flex', gap: sys.space.s2 })
