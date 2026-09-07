/**
 * The duplicate guard.
 *
 * It shows the record it matched rather than a warning colour: the point is
 * not "careful", it is "here is what you already have - do you want that
 * instead?". Amber appears as a 2px spine only, so it never competes with the
 * primary button sitting a few pixels below it.
 *
 * Put statusTone[existing.status] on the record row so it carries the same
 * spine colour it has on the board.
 */
import { style } from '@vanilla-extract/css';
import { sys, vars } from '../app/theme.css';
import { tone } from '../styles/status.css';

export const warning = style({
  display: 'flex',
  flexDirection: 'column',
  gap: sys.space.s2,
  padding: sys.space.s3,
  border: `${sys.border.width} solid ${vars.color.borderStrong}`,
  borderLeft: `2px solid ${vars.color.accent}`,
  borderRadius: sys.radius.sm,
});

export const label = style({
  fontFamily: sys.font.mono,
  fontSize: sys.fontSize.micro,
  letterSpacing: '0.09em',
  textTransform: 'uppercase',
  color: vars.color.accent,
});

export const text = style({ margin: 0, fontSize: sys.fontSize.small, color: vars.color.muted });

export const record = style({
  display: 'flex',
  alignItems: 'center',
  gap: sys.space.s2,
  padding: sys.space.s2,
  background: vars.color.surface,
  border: `${sys.border.width} solid ${vars.color.border}`,
  borderLeft: `2px solid ${tone}`,
  borderRadius: sys.radius.sm,
});

export const recordCompany = style({ fontSize: sys.fontSize.body, fontWeight: 600 });
export const recordRole = style({ fontSize: sys.fontSize.small, color: vars.color.muted });
export const recordMeta = style({
  marginLeft: 'auto',
  fontFamily: sys.font.mono,
  fontSize: sys.fontSize.meta,
  color: vars.color.muted,
});

export const actions = style({ display: 'flex', gap: sys.space.s2 });
