/**
 * The board: five columns as fields on a ruled sheet.
 * No gutters and no column backgrounds - full-height hairlines and a 2px
 * status rule under each header. That is the whole idea; if it reads as too
 * austere, tint the column headers to surface rather than adding gutters.
 */
import { style } from '@vanilla-extract/css';
import { bp, sys, vars } from '../app/theme.css';
import { tone } from '../styles/status.css';

export const board = style({
  flex: 1,
  minHeight: 0,
  display: 'grid',
  gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
  '@media': {
    /* Below this the board scrolls inside itself. The page never scrolls
     * sideways, and no column is ever hidden: a pipeline with a missing
     * stage is a pipeline you stop trusting. */
    [bp.narrow]: {
      gridTemplateColumns: 'repeat(5, minmax(208px, 1fr))',
      overflowX: 'auto',
    },
  },
});

export const column = style({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  borderRight: `${sys.border.width} solid ${vars.color.border}`,
  selectors: { '&:last-child': { borderRight: 0 } },
});

export const columnHeader = style({
  flex: 'none',
  height: '38px',
  display: 'flex',
  alignItems: 'center',
  gap: sys.space.s2,
  padding: `0 ${sys.space.s3}`,
  borderBottom: `${sys.border.width} solid ${vars.color.border}`,
  '@media': { [bp.laptop]: { padding: `0 ${sys.space.s2}` } },
});

export const columnGlyph = style({ display: 'flex', flex: 'none', color: tone });

export const columnName = style({
  fontSize: sys.fontSize.small,
  fontWeight: 600,
  letterSpacing: '0.01em',
});

export const columnCount = style({
  marginLeft: 'auto',
  fontFamily: sys.font.mono,
  fontSize: sys.fontSize.meta,
  fontVariantNumeric: 'tabular-nums',
  color: vars.color.muted,
});

/** The status rule. Carries the colour; the glyph carries the meaning. */
export const columnRule = style({ flex: 'none', height: '2px', background: tone });

/** ul, not a div - position and count get announced. */
export const stack = style({
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: sys.space.s2,
  padding: sys.space.s3,
  margin: 0,
  listStyle: 'none',
  /* Each column scrolls on its own. The mockup could get away with `hidden`
   * because it had a fixed three cards; a real Applied column will not, and
   * clipped cards would be unreachable rather than merely off-screen. */
  overflowY: 'auto',
  overflowX: 'hidden',
  '@media': { [bp.laptop]: { padding: sys.space.s2 } },
});
