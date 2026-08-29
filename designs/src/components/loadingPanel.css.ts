/**
 * The tailoring call takes seconds, so the wait is narrated rather than spun:
 * named steps that tick over, an elapsed counter, and a 2px sweep. Under
 * prefers-reduced-motion the sweep parks and the step list carries it alone.
 */
import { keyframes, style, styleVariants } from '@vanilla-extract/css';
import { sys, vars } from '../app/theme.css';

const sweep = keyframes({
  '0%': { transform: 'translateX(-100%)' },
  '100%': { transform: 'translateX(305%)' },
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

export const sweepBar = style({
  position: 'absolute',
  inset: '0 auto 0 0',
  width: '38%',
  background: vars.color.accent,
  animation: `${sweep} 1.5s cubic-bezier(.65,0,.35,1) infinite`,
  '@media': {
    '(prefers-reduced-motion: reduce)': { animation: 'none', width: '45%' },
  },
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
  current: { color: vars.color.text, '::before': { content: '"[>] "' } },
  todo: { color: vars.color.muted, opacity: 0.55, '::before': { content: '"[ ] "' } },
});
