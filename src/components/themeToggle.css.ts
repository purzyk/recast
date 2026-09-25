import { globalStyle, style } from '@vanilla-extract/css'
import { darkTheme, lightTheme } from '../app/theme.css'

/** Shown while the document is in that theme. `display: none` also removes
 *  the hidden label from the accessibility tree. */
export const whenDark = style({})
export const whenLight = style({})

globalStyle(`${lightTheme} ${whenDark}, ${darkTheme} ${whenLight}`, { display: 'none' })
