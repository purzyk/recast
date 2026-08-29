/** Companies index, status history, the experience library. */
import { style } from '@vanilla-extract/css';
import { sys, vars } from '../app/theme.css';

export const table = style({
  width: '100%',
  borderCollapse: 'collapse',
  color: vars.color.text,
  fontFamily: sys.font.sans,
  fontSize: sys.fontSize.body,
});

export const th = style({
  padding: `0 ${sys.space.s3} ${sys.space.s2}`,
  borderBottom: `${sys.border.width} solid ${vars.color.border}`,
  fontFamily: sys.font.mono,
  fontSize: sys.fontSize.micro,
  fontWeight: 400,
  letterSpacing: '0.09em',
  textTransform: 'uppercase',
  textAlign: 'left',
  color: vars.color.muted,
});

export const row = style({
  selectors: {
    '&:hover': { background: vars.color.surfaceHi },
  },
});

export const td = style({
  padding: `9px ${sys.space.s3}`,
  borderBottom: `${sys.border.width} solid ${vars.color.border}`,
  verticalAlign: 'middle',
  selectors: {
    /* The last row keeps the panel's own edge rather than doubling it. */
    [`${row}:last-child &`]: { borderBottom: 0 },
  },
});

/** Numeric and date cells. Right aligned, mono, tabular. Apply to the th too,
 *  or the header drifts off its column. */
export const num = style({
  fontFamily: sys.font.mono,
  fontSize: sys.fontSize.meta,
  fontVariantNumeric: 'tabular-nums',
  textAlign: 'right',
  whiteSpace: 'nowrap',
  color: vars.color.muted,
});

export const primaryCell = style({ fontWeight: 600 });
export const dimCell = style({ color: vars.color.muted, fontSize: sys.fontSize.small });
