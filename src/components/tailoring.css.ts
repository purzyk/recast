/**
 * The two tailoring screens - generating and review - share one frame:
 * the posting on the left, the output on the right, a step trail in the
 * header. Everything else they draw comes from screen.css and loadingPanel.css.
 */
import { globalStyle, style } from '@vanilla-extract/css'
import { bp, sys, vars } from '../app/theme.css'

export const shell = style({
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  background: vars.color.bg,
  color: vars.color.text,
})

export const twoPane = style({
  gridTemplateColumns: '1fr 1fr',
  '@media': { [bp.laptop]: { gridTemplateColumns: '1fr' } },
})

export const steps = style({
  display: 'flex',
  alignItems: 'center',
  gap: sys.space.s3,
  margin: 0,
  padding: 0,
  listStyle: 'none',
  fontFamily: sys.font.mono,
  fontSize: sys.fontSize.micro,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: vars.color.muted,
})

export const step = style({
  display: 'flex',
  alignItems: 'center',
  gap: sys.space.s3,
  selectors: {
    '& + &::before': { content: '""', width: '14px', height: '1px', background: vars.color.border },
  },
})

export const stepCurrent = style({ color: vars.color.text })

export const stepNumber = style({
  selectors: { [`${stepCurrent} &`]: { color: vars.color.accent } },
})

/** The posting as pasted. Line breaks are the author's structure; keep them. */
export const posting = style({
  margin: 0,
  whiteSpace: 'pre-wrap',
  fontSize: sys.fontSize.small,
  lineHeight: 1.6,
  color: vars.color.muted,
})

export const outputForm = style({
  display: 'flex',
  flexDirection: 'column',
  gap: sys.space.s3,
})

/** CV or cover letter. Two radios dressed as one control. */
export const kindChoice = style({
  display: 'inline-flex',
  alignSelf: 'flex-start',
  margin: 0,
  padding: 0,
  border: `${sys.border.width} solid ${vars.color.borderStrong}`,
  borderRadius: sys.radius.sm,
  overflow: 'hidden',
})

export const kindOption = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  height: '28px',
  padding: `0 ${sys.space.s3}`,
  fontSize: sys.fontSize.small,
  color: vars.color.muted,
  cursor: 'pointer',
  selectors: {
    '& + &': { borderLeft: `${sys.border.width} solid ${vars.color.borderStrong}` },
    '&:has(input:checked)': { background: vars.color.surfaceHi, color: vars.color.text, fontWeight: 600 },
    '&:has(input:focus-visible)': { outline: `2px solid ${vars.color.accent}`, outlineOffset: '-2px' },
  },
})

export const kindInput = style({ position: 'absolute', opacity: 0, pointerEvents: 'none' })

export const error = style({
  margin: 0,
  padding: `${sys.space.s2} ${sys.space.s3}`,
  borderLeft: `2px solid ${vars.color.danger}`,
  background: vars.color.surface,
  fontSize: sys.fontSize.small,
  color: vars.color.text,
})

export const note = style({
  margin: `${sys.space.s3} 0 0`,
  fontFamily: sys.font.mono,
  fontSize: sys.fontSize.micro,
  lineHeight: 1.6,
  color: vars.color.muted,
})

/* ---- review ------------------------------------------------------- */

export const blockTop = style({ display: 'flex', alignItems: 'baseline', gap: sys.space.s2 })

export const blockText = style({ margin: 0, fontSize: sys.fontSize.small, lineHeight: 1.55, whiteSpace: 'pre-wrap' })

export const blockList = style({
  margin: 0,
  paddingLeft: sys.space.s4,
  fontSize: sys.fontSize.small,
  lineHeight: 1.55,
})

globalStyle(`${blockList} li + li`, { marginTop: '3px' })

/** The edit affordance is a real button, so it resets the button chrome. */
export const editButton = style({
  padding: 0,
  border: 0,
  background: 'none',
  font: 'inherit',
  color: 'inherit',
  cursor: 'pointer',
  selectors: { '&:focus-visible': { opacity: 1 } },
})

export const editor = style({ display: 'flex', flexDirection: 'column', gap: sys.space.s2 })
export const editorActions = style({ display: 'flex', gap: sys.space.s2 })

export const sources = style({ color: vars.color.text })

export const unmatched = style({ color: vars.color.text })

export const meta = style({
  margin: `${sys.space.s4} 0 0`,
  fontFamily: sys.font.mono,
  fontSize: sys.fontSize.micro,
  color: vars.color.muted,
})

export const versions = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: sys.space.s2,
  margin: `${sys.space.s1} 0 0`,
  fontFamily: sys.font.mono,
  fontSize: sys.fontSize.meta,
})
