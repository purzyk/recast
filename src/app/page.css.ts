import { style } from '@vanilla-extract/css'
import { vars } from './theme.css'

/** The board fills the viewport: the bar is fixed height, the board takes
 *  the rest, and columns scroll inside themselves rather than the page. */
export const shell = style({
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  background: vars.color.bg,
  color: vars.color.text,
})
