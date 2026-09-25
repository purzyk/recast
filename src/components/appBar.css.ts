/** 52px, identical on every screen, so navigation never shifts. */
import { style } from '@vanilla-extract/css';
import { bp, sys, vars } from '../app/theme.css';

export const bar = style({
  position: 'relative',
  zIndex: 20,
  flex: 'none',
  height: '52px',
  display: 'flex',
  alignItems: 'center',
  gap: sys.space.s4,
  padding: `0 ${sys.space.s5}`,
  borderBottom: `${sys.border.width} solid ${vars.color.border}`,
  '@media': { [bp.laptop]: { padding: `0 ${sys.space.s4}`, gap: sys.space.s3 } },
  background: vars.color.bg,
});

/** Also the link home, so it resets anchor styling. */
export const wordmark = style({
  fontSize: sys.fontSize.h3,
  fontWeight: 600,
  letterSpacing: '-0.015em',
  color: 'inherit',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: sys.space.s2,
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

/** Where you are. Text colour plus a 2px accent rule under the label: the
 *  rule carries it for anyone who cannot tell the grey from the white. */
export const navActive = style({
  color: vars.color.text,
  background: vars.color.surfaceHi,
  boxShadow: `inset 0 -2px 0 ${vars.color.accent}`,
});

/* ---- responsive: the nav folds into a menu at phone width -------------- */

/** Board, Companies, Experience, theme and sign-out: in the bar on desktop,
 *  in the menu panel on a phone. */
export const desktopOnly = style({
  display: 'flex',
  alignItems: 'center',
  gap: sys.space.s2,
  '@media': { [bp.mobile]: { display: 'none' } },
});

export const mobileMenu = style({
  display: 'none',
  '@media': { [bp.mobile]: { display: 'block' } },
});

export const menuPanel = style({
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  padding: `${sys.space.s2} ${sys.space.s4} ${sys.space.s3}`,
  background: vars.color.surface,
  borderBottom: `${sys.border.width} solid ${vars.color.borderStrong}`,
  selectors: { '&[hidden]': { display: 'none' } },
});

export const menuDivider = style({
  height: '1px',
  margin: `${sys.space.s1} 0`,
  background: vars.color.border,
});

/** A full-width row in the menu panel; composed with the ghost button. */
// Scoped under the panel: the ghost button's own height and background load
// later and would otherwise win at equal specificity.
export const menuItem = style({
  selectors: {
    [`${menuPanel} &`]: {
      width: '100%',
      height: '40px',
      justifyContent: 'flex-start',
      fontSize: sys.fontSize.body,
    },
  },
});

export const menuActive = style({
  selectors: {
    [`${menuPanel} &`]: {
      color: vars.color.text,
      background: vars.color.surfaceHi,
      boxShadow: `inset 2px 0 0 ${vars.color.accent}`,
    },
  },
});

/** "Add application" in the bar, just "Add" on a phone. */
export const longLabel = style({ '@media': { [bp.mobile]: { display: 'none' } } });
export const shortLabel = style({ display: 'none', '@media': { [bp.mobile]: { display: 'inline' } } });
