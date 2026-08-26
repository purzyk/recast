# Recast — Design Spec

Brief for a separate design pass (e.g. with Claude Design). Covers what the app is,
who uses it, the screens it needs, and the visual direction — not the technical
build, which is tracked in PLAN.md.

## What it is

A personal tool with two jobs: track every job application so the same posting is
never applied to twice, and generate a tailored CV/cover letter for a specific
application from a stored body of real experience plus a pasted job description.

## Who uses it

One user (the owner). No multi-tenant concerns, no onboarding flow, no marketing
pages — this is closer to an internal dashboard than a product.

## Core screens

1. **Pipeline board** — the home view. Kanban-style columns by status: Saved →
   Applied → Interview → Offer / Rejected. Each card: company, role title, date
   moved into this status, a link to the original posting.
2. **Application detail** — one record's full view: company, role, JD text (or a
   link to it), status with history of status changes, notes, the generated
   CV/cover letter tied to this application, dates (applied, last contact).
3. **New application** — form to add a posting: company, role, JD paste, source
   link. Entry point to the tailoring flow.
4. **Tailoring flow** — paste/confirm the job description → generate → review the
   output alongside the source JD → edit → save to the application record. The
   output should be visibly editable, not a black box the user has to trust blind.
5. **Experience library** — where the source material lives: work history,
   individual projects, skills, achievements. This is what the tailoring step reads
   from, so it needs to be easy to keep current, not a one-time import.
6. **Companies view** — optional secondary index: every company applied to, so a
   past posting is checkable before applying again even outside the main board.

## Key states to design for

- Empty states: no applications yet, no experience data yet (first-run)
- Tailoring in progress (the AI call takes a few seconds — needs a loading state)
- A stale/duplicate warning when adding a posting that matches a company+role
  already in the pipeline

## Visual direction

- This is a personal tool, not a client-facing product — favor utility and density
  over the marketing polish of the purzycki.pl case studies.
- Reuse the existing design language where it makes sense for consistency with the
  rest of the portfolio work (monospace accents for meta/labels, the existing
  light/dark theme approach, similar spacing scale) — but don't force it where a
  denser, more dashboard-like layout serves the pipeline board or data tables
  better.
- Kanban board and data tables are the two layouts doing the most work here; get
  those right before spending time on anything else.

## Design system to produce

The design pass should settle these, because implementation reads directly from
them. They become tokens in `src/app/theme.css.ts` — see STYLING.md.

### Tokens needed

- **Colour:** page background, raised surface, border, primary text, muted text, accent. Both a light and a dark palette — the portfolio site has a theme toggle and this should match that expectation.
- **Status colours:** one per pipeline stage (saved, applied, interview, offer, rejected). These carry meaning, so they need to stay distinguishable in both themes and not rely on hue alone.
- **Spacing scale:** a small fixed set (4/8/16/24/40 is the current placeholder). Dense enough for tables, not cramped.
- **Type scale:** body, small/meta, and two or three heading sizes. A mono face for metadata and counts reads well against the sans and matches the portfolio's voice.
- **Radii and borders:** one or two radii, one border colour. This is a utility tool; heavy shadows and large radii will fight the density.

### Component inventory

The screens above decompose into roughly these. Designing them once, as a set,
beats designing each screen in isolation:

- Application card (as it appears on the board)
- Pipeline column / board container
- Status badge (five states)
- Data table row (companies list, application history)
- Form field set (text, textarea, select, date)
- Button (primary, secondary, destructive)
- Empty state
- Loading state (specifically for the AI tailoring call, which takes seconds)
- Inline warning (the duplicate-application guard)

### Constraints from the build

- **Desktop-first**, but the board must degrade sanely at laptop widths — five columns is a lot of horizontal space.
- Tables and the board should scroll within their own container, never make the page scroll sideways.
- Prefer flat colour and borders over gradients and shadows: it keeps the token set small and the CSS simple.

## Explicitly out of scope for this design pass

- Multi-user / team features
- Mobile-first design (desktop-first is fine — this is a tool used at a desk)
- The mock-interview and MCP-server stretch ideas from PLAN.md Phase 10
- Light/dark theming *machinery* — the palettes are in scope, the implementation is deferred (STYLING.md)
