/** Text, textarea, select, date - one control, four shapes. */
import { style } from '@vanilla-extract/css';
import { sys, vars } from '../app/theme.css';

export const field = style({ display: 'flex', flexDirection: 'column', gap: sys.space.s1 });

/** Marker for the field wrapper. Errors say what went wrong and how to fix
 *  it - colour is the second signal, the message is the first. */
export const invalid = style({});

export const label = style({
  fontFamily: sys.font.mono,
  fontSize: sys.fontSize.micro,
  letterSpacing: '0.09em',
  textTransform: 'uppercase',
  color: vars.color.muted,
});

export const control = style({
  width: '100%',
  height: '30px',
  padding: `0 ${sys.space.s2}`,
  background: vars.color.surface,
  color: vars.color.text,
  border: `${sys.border.width} solid ${vars.color.borderStrong}`,
  borderRadius: sys.radius.sm,
  fontFamily: sys.font.sans,
  fontSize: sys.fontSize.body,
  selectors: {
    '&::placeholder': { color: vars.color.muted },
    /* The accent's third job. Doubling the border with a ring keeps the
     * control from shifting by a pixel on focus. */
    '&:focus': {
      outline: 'none',
      borderColor: vars.color.accent,
      boxShadow: `0 0 0 1px ${vars.color.accent}`,
    },
    [`${invalid} &`]: { borderColor: vars.color.danger },
  },
});

export const textarea = style({
  height: 'auto',
  padding: sys.space.s2,
  lineHeight: 1.5,
  fontSize: sys.fontSize.small,
  resize: 'none',
});

/** Wrap a select with this and render the caret inside it. */
export const selectWrap = style({ position: 'relative', display: 'flex', alignItems: 'center' });
export const select = style({ appearance: 'none', cursor: 'pointer' });
export const caret = style({
  position: 'absolute',
  right: '9px',
  color: vars.color.muted,
  pointerEvents: 'none',
});

/** URLs, dates, anything you read character by character. */
export const monoControl = style({ fontFamily: sys.font.mono, fontSize: sys.fontSize.small });

export const hint = style({
  fontFamily: sys.font.mono,
  fontSize: sys.fontSize.micro,
  color: vars.color.muted,
  selectors: {
    [`${invalid} &`]: { color: vars.color.danger },
  },
});
