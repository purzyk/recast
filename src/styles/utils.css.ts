import { style } from '@vanilla-extract/css';
import { sys, vars } from '../app/theme.css';

/** Visible to screen readers, not to eyes. Used by the external-link mark
 *  and the column counts - see STYLING.md, Accessibility. */
export const srOnly = style({
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  /* `clip` is deprecated but still the only thing some older engines honour,
   * so both ship: clipPath is the one that actually applies today. */
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
  border: 0,
});

/** Any run of digits that sits in a column: counts, dates, elapsed time.
 *  Without this the numbers jitter as they change. */
export const tabular = style({
  fontFamily: sys.font.mono,
  fontVariantNumeric: 'tabular-nums',
});

/** The mono micro label used above fields, panes and rails. */
export const microLabel = style({
  fontFamily: sys.font.mono,
  fontSize: sys.fontSize.micro,
  letterSpacing: '0.09em',
  textTransform: 'uppercase',
  color: vars.color.muted,
});
