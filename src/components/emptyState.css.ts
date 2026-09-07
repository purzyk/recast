/**
 * Two variants of the same thing.
 *   emptyState  - first run. Invites an action.
 *   quiet       - an empty column on a working board. Says nothing is wrong.
 * Dashed, never filled: an empty field, not a broken container.
 */
import { style } from '@vanilla-extract/css';
import { sys, vars } from '../app/theme.css';

export const emptyState = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: sys.space.s2,
  padding: `${sys.space.s5} ${sys.space.s4}`,
  border: `${sys.border.width} dashed ${vars.color.border}`,
  borderRadius: sys.radius.md,
  textAlign: 'center',
});

export const quiet = style({ padding: `${sys.space.s4} ${sys.space.s3}` });

export const line = style({ margin: 0, fontSize: sys.fontSize.small, color: vars.color.muted });
export const lead = style({ fontSize: sys.fontSize.body, color: vars.color.text });
export const sub = style({
  fontFamily: sys.font.mono,
  fontSize: sys.fontSize.meta,
  opacity: 0.8,
});
