/**
 * Global resets and the two rules every screen depends on.
 * Import once, in the root layout.
 */
import { globalStyle } from '@vanilla-extract/css';
import { darkTheme, lightTheme, sys, vars } from './theme.css';

globalStyle('*, *::before, *::after', { boxSizing: 'border-box' });

globalStyle('html, body', {
  margin: 0,
  height: '100%',
  background: vars.color.bg,
  color: vars.color.text,
  fontFamily: sys.font.sans,
  fontSize: sys.fontSize.body,
  lineHeight: 1.5,
  WebkitFontSmoothing: 'antialiased',
});

/** Native controls - scrollbars, date pickers, select popups - follow the
 *  chosen theme, not the OS preference. This has to be bound to the theme
 *  class rather than set once on html: a static `dark light` lets the UA fall
 *  back to the OS setting, so picking light on a dark-set machine leaves you
 *  with a light app and dark scrollbars. */
globalStyle(`.${darkTheme}`, { colorScheme: 'dark' });
globalStyle(`.${lightTheme}`, { colorScheme: 'light' });

/** Tables do not inherit colour or font in quirks mode, and the failure is
 *  silent. Belt and braces - it costs nothing. */
globalStyle('table', { color: 'inherit', fontFamily: 'inherit', borderCollapse: 'collapse' });

/** One focus treatment across the app. Keyboard only; never removed. */
globalStyle(':focus-visible', {
  outline: `2px solid ${vars.color.accent}`,
  outlineOffset: '2px',
});

globalStyle('button, input, select, textarea', { font: 'inherit' });

globalStyle('*', {
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      animationDuration: '0.01ms !important',
      animationIterationCount: '1 !important',
      transitionDuration: '0.01ms !important',
    },
  },
});
