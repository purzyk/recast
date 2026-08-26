import { style } from '@vanilla-extract/css'
import { tokens } from './theme.css'

export const main = style({
  minHeight: '100vh',
  background: tokens.color.page,
  color: tokens.color.ink,
  fontFamily: tokens.font.body,
  padding: tokens.space.xl,
})

export const card = style({
  background: tokens.color.surface,
  border: `1px solid ${tokens.color.border}`,
  borderRadius: tokens.radius.md,
  padding: tokens.space.lg,
  maxWidth: '32rem',
})

export const title = style({
  margin: 0,
  fontSize: '1.5rem',
})

export const note = style({
  marginTop: tokens.space.sm,
  marginBottom: 0,
  color: tokens.color.inkMuted,
  fontFamily: tokens.font.mono,
  fontSize: '0.875rem',
})
