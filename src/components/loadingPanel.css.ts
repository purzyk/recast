/**
 * The tailoring call takes seconds, so the wait is narrated rather than spun:
 * named steps that tick over, an elapsed counter, a 2px bar that fills one
 * step at a time, and a spinning marker on the current step. The bar moves
 * only when the step changes, so it stays calm in a sped-up recording, where
 * a looping sweep strobed. Under prefers-reduced-motion the marker holds still.
 */
import { keyframes, style, styleVariants } from '@vanilla-extract/css';
import { sys, vars } from '../app/theme.css';

const spin = keyframes({
  '0%': { content: '"[|] "' },
  '25%': { content: '"[/] "' },
  '50%': { content: '"[-] "' },
  '75%': { content: '"[\\\\] "' },
});

export const panel = style({
  display: 'flex',
  flexDirection: 'column',
  gap: sys.space.s3,
  padding: sys.space.s4,
  border: `${sys.border.width} solid ${vars.color.borderStrong}`,
  borderRadius: sys.radius.md,
});

export const header = style({ display: 'flex', alignItems: 'baseline', gap: sys.space.s2 });
export const title = style({ fontSize: sys.fontSize.body, fontWeight: 600 });

export const elapsed = style({
  marginLeft: 'auto',
  fontFamily: sys.font.mono,
  fontSize: sys.fontSize.meta,
  fontVariantNumeric: 'tabular-nums',
  color: vars.color.muted,
});

export const track = style({
  position: 'relative',
  height: '2px',
  overflow: 'hidden',
  background: vars.color.border,
});

/** Width is set inline from the current step. */
export const fill = style({
  position: 'absolute',
  inset: '0 auto 0 0',
  background: vars.color.accent,
  transition: 'width 600ms cubic-bezier(.65,0,.35,1)',
  '@media': { '(prefers-reduced-motion: reduce)': { transition: 'none' } },
});

export const steps = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '5px',
  fontFamily: sys.font.mono,
  fontSize: sys.fontSize.meta,
});

/** The marker is text, so the state survives with no colour at all. */
export const step = styleVariants({
  done: { color: vars.color.muted, '::before': { content: '"[x] "' } },
  current: {
    color: vars.color.text,
    '::before': { content: '"[>] "', animation: `${spin} 0.8s linear infinite` },
    '@media': {
      '(prefers-reduced-motion: reduce)': { selectors: { '&::before': { animation: 'none' } } },
    },
  },
  todo: { color: vars.color.muted, opacity: 0.55, '::before': { content: '"[ ] "' } },
});
