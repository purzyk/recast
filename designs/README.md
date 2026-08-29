# Recast — design handoff

What the design pass settled, in the form the build reads.

## What is here

```
STYLING.md            The design system as rules. Read this first.
src/app/theme.css.ts  Tokens: colour contract, two themes, scales, breakpoints
src/app/global.css.ts Resets, focus ring, the quirks-mode table guard
src/styles/           status tone (styleVariants) and small utilities
src/components/       One .css.ts per component. No React — those are yours
src/lib/status.ts     Status type, labels, and the glyph geometry
mockups/              The two design artifacts, as standalone HTML
```

The `src/` tree is laid out at the paths it belongs at, relative to the repo
root, so it can be copied across as-is.

## Components covered

Application card, pipeline column and board, status badge, data table row,
form field set, button (primary / secondary / destructive / ghost), empty
state, loading panel, inline warning — plus the shared app bar and screen
chrome the five non-board screens are built from.

## The mockups

- `mockups/pipeline-board.html` — the board in both themes, the full token
  sheet, the 1100px degradation, and the handoff notes
- `mockups/screens-and-components.html` — the nine components in both themes,
  then new application, application detail, tailoring (generating and review),
  experience library and companies

Both are self-contained: open them in a browser, hover things, tab through
them. Every frame has a fit-to-width / actual-size toggle.

Live versions:

- Board: https://claude.ai/code/artifact/dc3a14eb-6e3e-42c7-ac35-8432607a36c3
- Screens: https://claude.ai/code/artifact/3343bed3-babe-475d-9120-2fac563afabb

## Before you start

The design leaves three things deliberately open — they are decisions, not
gaps, and each is argued in section 09 of the screens artifact:

1. The duplicate guard warns rather than blocks.
2. Generated output saves as a version, never a replacement.
3. Status is changed from the detail screen, not by dragging.

## Not in scope here

Multi-user, mobile-first, and the theme plumbing itself (the provider and the
toggle). `STYLING.md` has the pre-hydration script the toggle needs.
