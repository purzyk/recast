/**
 * Shared chrome for the non-board screens: header, panes, section labels,
 * footer, plus the two pieces the detail and tailoring screens add - the
 * status history timeline and the generated document block.
 */
import { style } from '@vanilla-extract/css';
import { sys, vars } from '../app/theme.css';
import { tone } from '../styles/status.css';

export const header = style({
  flex: 'none',
  display: 'flex',
  alignItems: 'flex-end',
  gap: sys.space.s4,
  padding: `${sys.space.s4} ${sys.space.s5} ${sys.space.s3}`,
  borderBottom: `${sys.border.width} solid ${vars.color.border}`,
});

export const crumb = style({
  margin: `0 0 ${sys.space.s1}`,
  fontFamily: sys.font.mono,
  fontSize: sys.fontSize.micro,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: vars.color.muted,
});

export const title = style({
  margin: 0,
  fontSize: sys.fontSize.h1,
  fontWeight: 600,
  letterSpacing: '-0.015em',
  lineHeight: 1.15,
});

export const subtitle = style({ margin: '2px 0 0', fontSize: sys.fontSize.body, color: vars.color.muted });

export const headerActions = style({
  marginLeft: 'auto',
  display: 'flex',
  alignItems: 'center',
  gap: sys.space.s2,
});

/** Set gridTemplateColumns per screen: 560px 1fr, 300px 1fr 360px, 1fr 1fr. */
export const body = style({ flex: 1, minHeight: 0, display: 'grid' });

export const pane = style({
  minWidth: 0,
  overflow: 'hidden',
  padding: `${sys.space.s4} ${sys.space.s5}`,
  selectors: { '& + &': { borderLeft: `${sys.border.width} solid ${vars.color.border}` } },
});

/** Mono label with a rule that fills the rest of the line. */
export const paneLabel = style({
  display: 'flex',
  alignItems: 'center',
  gap: sys.space.s2,
  margin: `0 0 ${sys.space.s2}`,
  fontFamily: sys.font.mono,
  fontSize: sys.fontSize.micro,
  letterSpacing: '0.09em',
  textTransform: 'uppercase',
  color: vars.color.muted,
  '::after': { content: '""', flex: 1, height: '1px', background: vars.color.border },
});

export const footer = style({
  flex: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: sys.space.s2,
  padding: `${sys.space.s3} ${sys.space.s5}`,
  borderTop: `${sys.border.width} solid ${vars.color.border}`,
});

export const footerRight = style({ marginLeft: 'auto', display: 'flex', gap: sys.space.s2 });

export const prose = style({
  margin: 0,
  fontSize: sys.fontSize.small,
  lineHeight: 1.6,
  color: vars.color.muted,
  selectors: { '& + &': { marginTop: sys.space.s2 } },
});

/** A phrase in the job description that matched an experience entry. */
export const matched = style({
  color: vars.color.text,
  borderBottom: `1px solid ${vars.status.applied}`,
});

/* ---- status history ------------------------------------------------ */

export const history = style({ margin: 0, padding: 0, listStyle: 'none' });

export const historyItem = style({
  display: 'grid',
  gridTemplateColumns: '16px 1fr auto',
  gap: sys.space.s2,
  alignItems: 'baseline',
  padding: `${sys.space.s2} 0`,
  selectors: { '& + &': { borderTop: `${sys.border.width} solid ${vars.color.border}` } },
});

export const historyGlyph = style({ display: 'flex', alignSelf: 'center', color: tone });
export const historyDate = style({
  fontFamily: sys.font.mono,
  fontSize: sys.fontSize.meta,
  fontVariantNumeric: 'tabular-nums',
  color: vars.color.muted,
});

/* ---- generated document block --------------------------------------- */

/** Editable, and visibly so. Hovering reveals the edit affordance; a block
 *  the user has touched is marked edited and is left alone by regeneration. */
export const block = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  padding: sys.space.s3,
  border: `${sys.border.width} solid ${vars.color.border}`,
  borderRadius: sys.radius.sm,
  selectors: {
    '&:hover': { borderColor: vars.color.borderStrong, background: vars.color.surface },
    '& + &': { marginTop: sys.space.s2 },
  },
});

export const blockLabel = style({
  fontFamily: sys.font.mono,
  fontSize: sys.fontSize.micro,
  letterSpacing: '0.09em',
  textTransform: 'uppercase',
  color: vars.color.muted,
});

export const blockEdit = style({
  marginLeft: 'auto',
  fontFamily: sys.font.mono,
  fontSize: sys.fontSize.micro,
  color: vars.color.muted,
  opacity: 0,
  selectors: { [`${block}:hover &`]: { opacity: 1, color: vars.color.accent } },
});

export const editedMark = style({
  fontFamily: sys.font.mono,
  fontSize: sys.fontSize.micro,
  color: vars.color.accent,
});

/** The anti-black-box line: which experience entries fed this block. */
export const provenance = style({
  marginTop: '2px',
  paddingTop: '2px',
  borderTop: `${sys.border.width} dashed ${vars.color.border}`,
  fontFamily: sys.font.mono,
  fontSize: sys.fontSize.micro,
  color: vars.color.muted,
});
