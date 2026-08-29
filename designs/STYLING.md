# Recast — styling

The design system, as rules rather than pictures. The mockups in `mockups/`
are the reference; this file is what to do when the mockups do not cover the
case you are looking at.

Everything here is implemented in `src/app/theme.css.ts` and the `.css.ts`
files beside it.

## The contract, in two layers

| Layer | Where | Swaps with the theme? |
| --- | --- | --- |
| `vars` — colour and status | `createThemeContract` + `darkTheme` / `lightTheme` | yes |
| `sys` — space, type, radius, border width | `createGlobalTheme(':root')` | no |

Two class names, swapped on `<html>`. Dark is primary.

Only colour is themed. Spacing and type are the same in both themes, so they
live on `:root` once — a second definition would be a second thing to keep in
sync for no benefit.

## Colour

| Token | Job |
| --- | --- |
| `bg` | Page and board ground |
| `surface` | Cards, inputs. The only raised plane |
| `surfaceHi` | Hover and selected. One step, never two |
| `border` | Structural rules: column separators, app bar, table rows |
| `borderStrong` | Anything clickable or typable: cards, controls, panels |
| `text` / `muted` | Content / metadata |
| `accent` | Primary button, focus ring, active field. Nothing else |
| `accentInk` | What sits on top of accent |
| `danger` | Destructive actions and field errors |

Three rules that keep this small:

1. **Two border weights, and the split is functional.** `border` is structure;
   `borderStrong` is anything you can click or type into. A card edge at
   `border` measures 1.3:1 against the card face — fine on a good monitor,
   gone on a cheap panel. `borderStrong` is 1.9:1.
2. **One accent, three uses.** Amber is the primary button, the focus ring and
   the active field border. It never appears on a card at rest; the focus ring
   is the exception, because that is transient state rather than decoration.
3. **One red.** `danger` carries the same value as `status.rejected`
   deliberately. The contexts never overlap — a button versus a column — and
   two nearly identical reds would be worse than one.

There are **no shadow tokens, and no shadows used for depth**. Depth is
`surface` against `bg` plus a hairline. If you want a shadow, you want
`borderStrong`.

One `box-shadow` does ship, in `field.css.ts`: a focus ring drawn as
`0 0 0 1px` so a focused control gains a second ring without its border
growing and shifting the layout by a pixel. That is geometry, not depth — it
is the intended exception, not a violation of the rule above.

### Measured contrast

Recomputed, not estimated. Ratios are against the ground named in brackets.

| | Dark | Light |
| --- | --- | --- |
| `text` on `bg` | 15.7:1 | 16.4:1 |
| `muted` on `surface` | 5.7:1 | 5.5:1 |
| `accentInk` on `accent` | 8.4:1 | 4.8:1 |
| weakest status on `bg` | 4.4:1 (saved) | 4.9:1 (applied) |

Light status values are **not** an inversion of the dark ones. They are
re-spaced so perceived lightness steps evenly (L\* 35 / 37.6 / 40.2 / 42.9 /
45.3) while every value clears 4.9:1 on `bg`. Do not brighten one without
recomputing both numbers — the 4.5:1 floor caps a light status near L\* 50,
so the whole set has to move together.

## Status

Five stages, and colour is never the only signal.

- **Hue** — `vars.status.*`
- **Glyph** — `lib/status.ts`, one primitive (a circle) opened, filled,
  halved, doubled, struck
- **Lightness** — laddered so a desaturated screenshot still separates all
  five: dark spans L\* 51 → 78

A status rendered as a coloured dot with no glyph is a bug. The glyph is what
carries it in greyscale, at 12px, and for anyone who cannot separate the blue
from the violet.

`styles/status.css.ts` sets one local var per status through `styleVariants`,
so descendants read `tone` without knowing which status they are in. That is
the mockups' `--stat` indirection, precompiled: five classes, no
`assignInlineVars`, no inline style attributes.

## Type

Two faces, and the split is semantic rather than aesthetic:

- **Archivo** — content. Company names, role titles, headings, buttons.
- **IBM Plex Mono** — anything countable or scannable character by character:
  dates, counts, URLs, uppercase labels, keyboard hints.

Seven sizes: `micro 10`, `meta 11`, `small 12`, `body 13`, `h3 15`, `h2 18`,
`h1 22`. If a screen needs an eighth, the scale is wrong — fix the scale.

Every run of digits that sits in a column gets `fontVariantNumeric:
'tabular-nums'`. Without it the column counts jitter as they change.

## Spacing and shape

`4 / 8 / 12 / 16 / 24 / 40`. Two radii: `3px` for controls, `5px` for cards
and panels. One border width. No off-scale values — at laptop width the board
steps *down the scale* rather than inventing a smaller number.

## Responsive

Desktop first at 1440. Five columns survive to about 1080, so at 1100 nothing
structural gives. In order:

1. App-bar tally drops; search collapses to its icon and expands on focus. The
   primary action never collapses.
2. Stack padding 12 → 8, card padding 8/12 → 7/8.
3. Role titles truncate to one line. **Company never truncates** — it is the
   scan target.
4. Below ~1040 the board scrolls inside its own container at a 208px column
   floor. The board scrolls; the page never scrolls sideways.
5. Nothing collapses columns. A pipeline with a hidden stage is a pipeline you
   stop trusting.

These live as `bp.laptop` and `bp.narrow` in `theme.css.ts`.

## Accessibility

Not optional, and cheap if done at build time rather than retrofitted:

- **Cards are links.** They open the detail view, so they are `<a>`, keyboard
  reachable, taking the global 2px accent focus ring. `:hover` alone is a bug.
- **Stacks are lists.** `<ul>` / `<li>`, so position and count are announced
  rather than a run of unrelated articles.
- **The external-link mark needs text.** A `title` attribute is unreliable for
  screen readers and invisible on touch. Use `srOnly` from `styles/utils`.
- **Counts need a label.** `3` on its own says nothing; render
  `3<span class={srOnly}> applications</span>`.
- **Errors explain.** The red border is the second signal; the message is the
  first, and it says how to fix it.
- **Motion is optional.** The loading sweep parks under
  `prefers-reduced-motion`; the step list carries the state alone.

## Setup notes

### Fonts

Through `next/font/google`, never a stylesheet `<link>` — self-hosted, no
render-blocking request, no swap flash.

```ts
// src/app/fonts.ts
import { Archivo, IBM_Plex_Mono } from 'next/font/google';

export const archivo = Archivo({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-archivo',
  display: 'swap',
});

export const plexMono = IBM_Plex_Mono({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-mono',
  display: 'swap',
});
```

`sys.font.sans` and `sys.font.mono` read those variables, so put both
`.variable` classes on `<html>`. Include `latin-ext` — the Polish diacritics
need it.

### Theme, without a flash

`darkTheme` and `lightTheme` are class names. Applying them from React paints
the wrong theme first, so the choice has to be resolved before hydration:

```tsx
// in <head>, before anything renders
<script dangerouslySetInnerHTML={{ __html: `
  (function () {
    try {
      var stored = localStorage.getItem('recast-theme');
      var dark = stored ? stored === 'dark'
        : !window.matchMedia('(prefers-color-scheme: light)').matches;
      document.documentElement.classList.add(dark ? '${darkTheme}' : '${lightTheme}');
    } catch (e) {
      document.documentElement.classList.add('${darkTheme}');
    }
  })();
` }} />
```

Dark is the fallback in the catch, because dark is primary.

### Gotchas

- **Tables do not inherit colour or font in quirks mode**, and the failure is
  silent. `global.css.ts` sets both explicitly. Keep it.
- **No inline style attributes for status.** `styleVariants`, not
  `assignInlineVars` — the set is closed and known at build time.
- **`.is-narrow` in the mockups is a demo device.** It exists so both widths
  render on one page. Ship it as a media query.
