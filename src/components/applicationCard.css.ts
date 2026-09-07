/**
 * The card is a link, not an article: it opens the detail view, so it has to
 * be keyboard reachable and take the global focus ring.
 */
import { style } from '@vanilla-extract/css';
import { bp, sys, vars } from '../app/theme.css';
import { tone } from '../styles/status.css';

export const card = style({
  display: 'flex',
  overflow: 'hidden',
  background: vars.color.surface,
  border: `${sys.border.width} solid ${vars.color.borderStrong}`,
  borderRadius: sys.radius.md,
  color: 'inherit',
  textDecoration: 'none',
  cursor: 'pointer',
  transition: 'border-color .12s linear, background-color .12s linear',
  selectors: {
    '&:hover': { background: vars.color.surfaceHi, borderColor: tone },
    '&:focus-visible': { background: vars.color.surfaceHi, borderColor: tone },
  },
});

/** 2px of the column's status colour, so a card taken out of context still
 *  says where it belongs. 65% at rest keeps the board quiet. */
export const spine = style({
  width: '2px',
  flex: 'none',
  background: tone,
  opacity: 0.65,
  transition: 'opacity .12s linear',
  selectors: {
    [`${card}:hover &`]: { opacity: 1 },
    [`${card}:focus-visible &`]: { opacity: 1 },
  },
});

export const body = style({
  flex: 1,
  minWidth: 0,
  padding: `${sys.space.s2} ${sys.space.s3} 9px`,
  '@media': { [bp.laptop]: { padding: `7px ${sys.space.s2} 8px` } },
});

export const top = style({ display: 'flex', alignItems: 'flex-start', gap: sys.space.s2 });

/** The scan target. Never truncates before the role does. */
export const company = style({
  margin: 0,
  minWidth: 0,
  fontSize: sys.fontSize.body,
  fontWeight: 600,
  letterSpacing: '-0.005em',
  lineHeight: 1.3,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const role = style({
  margin: '1px 0 0',
  fontSize: sys.fontSize.small,
  lineHeight: 1.35,
  color: vars.color.muted,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  /* Clamp alone, without nowrap: -webkit-box already constrains to one line
   * here, and adding nowrap can suppress the ellipsis in some engines. */
  '@media': { [bp.laptop]: { WebkitLineClamp: 1 } },
});

/** Time in this column, not the date it was created. */
export const age = style({
  margin: `${sys.space.s2} 0 0`,
  fontFamily: sys.font.mono,
  fontSize: sys.fontSize.meta,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: '-0.01em',
  color: vars.color.muted,
});

/** Shown only when a posting URL was saved - that is what makes it worth
 *  reading. Pair it with visually hidden text. */
export const externalMark = style({
  marginLeft: 'auto',
  paddingTop: '2px',
  display: 'flex',
  flex: 'none',
  color: vars.color.muted,
  opacity: 0.55,
  transition: 'opacity .12s linear',
  selectors: {
    [`${card}:hover &`]: { opacity: 1, color: vars.color.text },
    [`${card}:focus-visible &`]: { opacity: 1, color: vars.color.text },
  },
});
