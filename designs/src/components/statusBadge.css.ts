import { style } from '@vanilla-extract/css';
import { sys, vars } from '../app/theme.css';
import { tone } from '../styles/status.css';

/** Put statusTone[status] on this element, or on any ancestor. */
export const badge = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  height: '20px',
  padding: `0 ${sys.space.s2} 0 0`,
  background: vars.color.surface,
  border: `${sys.border.width} solid ${vars.color.border}`,
  borderLeft: `2px solid ${tone}`,
  borderRadius: sys.radius.sm,
  fontFamily: sys.font.mono,
  fontSize: sys.fontSize.micro,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: vars.color.text,
});

export const badgeLarge = style({ height: '24px', fontSize: sys.fontSize.meta });

/** The glyph. Always present - the badge never ships as colour plus text. */
export const glyph = style({ display: 'flex', color: tone, marginLeft: '7px' });
