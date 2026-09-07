/**
 * Recast design tokens.
 *
 * Two layers:
 *   vars - the colour contract. Swaps between darkTheme and lightTheme.
 *   sys  - scale, type and shape. Identical in both themes, so it lives on
 *          :root and never needs a second definition.
 *
 * Dark is primary. If a screen needs a value that is not in this file, the
 * scale is wrong - fix it here rather than reaching for a literal.
 */
import { createGlobalTheme, createTheme, createThemeContract } from '@vanilla-extract/css';

/* ---------------------------------------------------------------- *
 * Themed: colour only
 * ---------------------------------------------------------------- */
export const vars = createThemeContract({
  color: {
    /** page and board ground */
    bg: null,
    /** cards, inputs - the only raised plane */
    surface: null,
    /** hover and selected. One step, never two */
    surfaceHi: null,
    /** structural rules: column separators, the app bar, table rows */
    border: null,
    /** anything clickable or typable: cards, controls, panels */
    borderStrong: null,
    /** company names, headings */
    text: null,
    /** dates, counts, placeholders, secondary lines */
    muted: null,
    /** one accent, three uses: primary button, focus ring, active field */
    accent: null,
    /** text/icon colour that sits on top of accent */
    accentInk: null,
    /** destructive actions and field errors - deliberately the same red as
     *  status.rejected. This tool has one red; it means "ended badly". */
    danger: null,
  },
  /** Pipeline status. Never the only signal - always paired with the glyph
   *  in lib/status.ts. See STYLING.md. */
  status: {
    saved: null,
    applied: null,
    interview: null,
    offer: null,
    rejected: null,
  },
});

export const darkTheme = createTheme(vars, {
  color: {
    bg: '#0E1216',
    surface: '#161C22',
    surfaceHi: '#1D262E',
    border: '#262F38',
    borderStrong: '#3E4B5A',
    text: '#E6EBEF',
    muted: '#8896A3',
    accent: '#E2A03F',
    accentInk: '#0E1216',
    danger: '#C86F63',
  },
  status: {
    saved: '#6E7C8C',
    applied: '#5FA0E6',
    interview: '#C093F0',
    offer: '#63D6A2',
    rejected: '#C86F63',
  },
});

export const lightTheme = createTheme(vars, {
  color: {
    bg: '#F4F6F7',
    surface: '#FFFFFF',
    surfaceHi: '#EDF1F3',
    border: '#D8DEE3',
    borderStrong: '#BFC9D2',
    text: '#131820',
    muted: '#5D6B78',
    accent: '#A86205',
    accentInk: '#FFFFFF',
    danger: '#AC4338',
  },
  /* Not an inversion. Re-spaced so perceived lightness steps evenly
   * (L* 35 / 37.6 / 40.2 / 42.9 / 45.3) and every value clears 4.9:1 on
   * color.bg. Do not brighten these without recomputing both numbers. */
  status: {
    saved: '#4C5A69',
    applied: '#2B6CBA',
    interview: '#6739A4',
    offer: '#106C4B',
    rejected: '#AC4338',
  },
});

/* ---------------------------------------------------------------- *
 * Not themed: scale, type, shape
 * ---------------------------------------------------------------- */
export const sys = createGlobalTheme(':root', {
  space: {
    s1: '4px',
    s2: '8px',
    s3: '12px',
    s4: '16px',
    s5: '24px',
    s6: '40px',
  },
  font: {
    /* next/font/google supplies these variables - see STYLING.md */
    sans: 'var(--font-archivo), "Helvetica Neue", Arial, sans-serif',
    mono: 'var(--font-plex-mono), ui-monospace, SFMono-Regular, Menlo, monospace',
  },
  fontSize: {
    micro: '10px', // uppercase mono labels, kbd hints
    meta: '11px',  // dates, counts, search - mono
    small: '12px', // role titles, buttons, secondary lines
    body: '13px',  // company name, table cells
    h3: '15px',    // wordmark, panel titles
    h2: '18px',    // section titles
    h1: '22px',    // screen titles
  },
  radius: {
    sm: '3px', // buttons, inputs, chips, badges
    md: '5px', // cards, empty states, panels
  },
  border: {
    width: '1px', // one width, everywhere
  },
});

/** There are no shadow tokens, by design. Depth is surface against bg plus a
 *  hairline. If you want a shadow, you want borderStrong. */

/* ---------------------------------------------------------------- *
 * Breakpoints - plain strings, not CSS vars
 * ---------------------------------------------------------------- */
export const bp = {
  /** board sheds padding, role titles truncate to one line */
  laptop: 'screen and (max-width: 1200px)',
  /** board scrolls inside its own container at a 208px column floor */
  narrow: 'screen and (max-width: 1040px)',
} as const;
