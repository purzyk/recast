/** 52px, identical on every screen, so navigation never shifts. */
import { style } from '@vanilla-extract/css';
import { bp, sys, vars } from '../app/theme.css';

export const bar = style({
  flex: 'none',
  height: '52px',
  display: 'flex',
  alignItems: 'center',
  gap: sys.space.s4,
  padding: `0 ${sys.space.s5}`,
  borderBottom: `${sys.border.width} solid ${vars.color.border}`,
  '@media': { [bp.laptop]: { padding: `0 ${sys.space.s4}`, gap: sys.space.s3 } },
});

export const wordmark = style({
  fontSize: sys.fontSize.h3,
  fontWeight: 600,
  letterSpacing: '-0.015em',
});

export const divider = style({ width: '1px', height: '18px', background: vars.color.border });

/** First thing to go at laptop width. */
export const tally = style({
  fontFamily: sys.font.mono,
  fontSize: sys.fontSize.meta,
  fontVariantNumeric: 'tabular-nums',
  color: vars.color.muted,
  '@media': { [bp.laptop]: { display: 'none' } },
});

export const right = style({
  marginLeft: 'auto',
  display: 'flex',
  alignItems: 'center',
  gap: sys.space.s2,
});

export const search = style({ position: 'relative', display: 'flex', alignItems: 'center' });

export const searchIcon = style({
  position: 'absolute',
  left: '8px',
  color: vars.color.muted,
  pointerEvents: 'none',
});

export const searchInput = style({
  width: '230px',
  height: '28px',
  padding: '0 30px 0 26px',
  background: vars.color.surface,
  color: vars.color.text,
  border: `${sys.border.width} solid ${vars.color.border}`,
  borderRadius: sys.radius.sm,
  fontFamily: sys.font.mono,
  fontSize: sys.fontSize.meta,
  selectors: {
    '&::placeholder': { color: vars.color.muted },
    '&:focus': { outline: 'none', borderColor: vars.color.accent },
  },
  /* Collapses to its icon and expands on focus. The primary action never
   * collapses. */
  '@media': { [bp.laptop]: { width: '32px', padding: '0 0 0 26px', color: 'transparent' } },
});

export const kbdHint = style({
  position: 'absolute',
  right: '6px',
  padding: '1px 4px',
  border: `${sys.border.width} solid ${vars.color.border}`,
  borderRadius: '2px',
  fontFamily: sys.font.mono,
  fontSize: sys.fontSize.micro,
  lineHeight: 1.3,
  color: vars.color.muted,
  pointerEvents: 'none',
  '@media': { [bp.laptop]: { display: 'none' } },
});
