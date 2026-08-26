# Recast — Styling conventions

How styles work in this project, written for someone who hasn't used
CSS-in-JS before.

## The approach: vanilla-extract

Styles are written in TypeScript, in files ending `.css.ts`, and compiled to a
static stylesheet **at build time**. Nothing ships to the browser to make them
work — the output is ordinary CSS with hashed class names.

This is the important distinction from the CSS-in-JS you may have heard of
(styled-components, Emotion): those evaluate styles in the browser at runtime,
which forces every styled component to be a Client Component and gives up React
Server Components. vanilla-extract has no runtime, so components using it stay
Server Components.

### What you get over plain CSS

- **Type safety.** `tokens.color.acent` is a TypeScript error, not a silently dead style.
- **Autocomplete** on every token.
- **Locally scoped by default** — class names are hashed, so there are no naming collisions and no BEM discipline to maintain.
- **Dead style elimination** — unused exports get tree-shaken.

### What it costs

- One more build step to understand.
- Smaller community than Tailwind; fewer copy-paste answers when stuck.
- **Requires webpack, not Turbopack** (see below).

## The Turbopack constraint

Next 16 uses Turbopack by default. The vanilla-extract Next plugin registers a
webpack config, and Turbopack rejects the combination:

```
ERROR: This build is using Turbopack, with a `webpack` config and no `turbopack` config.
```

So both scripts in `package.json` pass `--webpack` explicitly:

```json
"dev": "next dev --webpack",
"build": "next build --webpack"
```

**This is a real tradeoff, not a workaround to forget about.** Turbopack is
faster and is the direction Next is heading; webpack is legacy. At this app's
size the build-time difference is negligible, but if a future Next release drops
webpack support, this needs revisiting.

Escape route if that happens: vanilla-extract styles are plain TypeScript
objects, so migrating to another zero-runtime system (Panda CSS, StyleX) is
mechanical rather than a rewrite. Worth knowing, not worth pre-empting.

## File conventions

| File | Purpose |
|---|---|
| `src/app/theme.css.ts` | Design tokens — the single source of truth for colour, spacing, type, radii |
| `*.css.ts` next to a component | That component's styles |

A `.css.ts` file may only contain style definitions and imports. It's evaluated
at build time, so it cannot reference anything that exists only at runtime
(request data, `window`, component props).

## How tokens work

`createGlobalTheme` both declares CSS custom properties on `:root` and returns
typed references to them:

```ts
// theme.css.ts
export const tokens = createGlobalTheme(':root', {
  color: { accent: '#3b82f6' },
  space: { md: '16px' },
})
```

```ts
// button.css.ts
import { tokens } from './theme.css'

export const button = style({
  background: tokens.color.accent,  // compiles to var(--color-accent-hash)
  padding: tokens.space.md,
})
```

```tsx
// Button.tsx — no 'use client' needed
import * as styles from './button.css'

export const Button = () => <button className={styles.button} />
```

Note the import path omits `.ts`: `./theme.css`, not `./theme.css.ts`.

## Patterns worth knowing

- `style({...})` — a single class.
- `styleVariants({...})` — a set of related classes from one object, e.g. one per pipeline status.
- `globalStyle('selector', {...})` — for resets and element defaults; use sparingly, it escapes scoping.
- Pseudo-selectors and media queries nest inside `style()`:

```ts
export const card = style({
  padding: tokens.space.md,
  ':hover': { borderColor: tokens.color.accent },
  '@media': {
    'screen and (max-width: 640px)': { padding: tokens.space.sm },
  },
})
```

## Light and dark

The current `theme.css.ts` defines one dark palette on `:root`. When light mode
is wanted, the pattern is `createThemeContract` (declares the shape) plus two
`createTheme` calls (one palette each), producing two class names to swap on the
root element. Deferred until the design pass settles the palettes — no point
building the machinery before knowing what goes in it.
