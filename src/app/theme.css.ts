import { createGlobalTheme } from '@vanilla-extract/css'

// Tokens live on :root as CSS custom properties. `createGlobalTheme` both
// declares them and hands back typed references, so `tokens.color.accent`
// in a .css.ts file resolves to `var(--color-accent-hash)` at build time —
// no runtime lookup, and a typo is a TypeScript error rather than a silently
// broken style.
export const tokens = createGlobalTheme(':root', {
  color: {
    page: '#0f1115',
    surface: '#161920',
    border: '#252932',
    ink: '#e6e8ec',
    inkMuted: '#8b919e',
    accent: '#3b82f6',
  },
  space: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '40px',
  },
  radius: {
    sm: '4px',
    md: '8px',
  },
  font: {
    body: 'system-ui, -apple-system, "Segoe UI", sans-serif',
    mono: 'ui-monospace, "Cascadia Code", Consolas, monospace',
  },
})
