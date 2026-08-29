import { style, styleVariants } from '@vanilla-extract/css';
import { sys, vars } from '../app/theme.css';

const base = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  height: '28px',
  padding: `0 ${sys.space.s3}`,
  border: `${sys.border.width} solid transparent`,
  borderRadius: sys.radius.sm,
  fontFamily: sys.font.sans,
  fontSize: sys.fontSize.small,
  fontWeight: 600,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  selectors: {
    '&:disabled': { opacity: 0.42, cursor: 'not-allowed', filter: 'none' },
  },
});

export const button = styleVariants({
  /** The only amber thing on screen. One per view. */
  primary: [base, {
    background: vars.color.accent,
    color: vars.color.accentInk,
    borderColor: vars.color.accent,
    selectors: { '&:hover:not(:disabled)': { filter: 'brightness(1.07)' } },
  }],
  secondary: [base, {
    background: 'transparent',
    color: vars.color.text,
    borderColor: vars.color.borderStrong,
    selectors: {
      '&:hover:not(:disabled)': { background: vars.color.surfaceHi, borderColor: vars.color.muted },
    },
  }],
  /** Outlined at rest, filled on hover - destructive should take a beat. */
  danger: [base, {
    background: 'transparent',
    color: vars.color.danger,
    borderColor: vars.color.danger,
    selectors: {
      '&:hover:not(:disabled)': { background: vars.color.danger, color: vars.color.accentInk },
    },
  }],
  ghost: [base, {
    background: 'transparent',
    color: vars.color.muted,
    borderColor: 'transparent',
    selectors: {
      '&:hover:not(:disabled)': { color: vars.color.text, background: vars.color.surfaceHi },
    },
  }],
});

/** Form submits and the one action a screen is about. */
export const large = style({ height: '32px', padding: `0 ${sys.space.s4}` });
