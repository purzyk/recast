/**
 * The status tone.
 *
 * The mockups set `--stat` inline and read it in children. The status set is
 * closed and known at build time, so it precompiles: five classes, each
 * assigning one local var. No assignInlineVars, no inline style attributes.
 *
 *   <section className={statusTone[status]}>   // sets the var
 *     <span className={spine} />               // reads it
 *
 * Anything nested inside can read `tone` without knowing which status it is,
 * which is what keeps card, badge, column header and warning in sync.
 */
import { createVar, styleVariants } from '@vanilla-extract/css';
import { vars } from '../app/theme.css';

/** Read this in any descendant of a statusTone element. */
export const tone = createVar();

export const statusTone = styleVariants(vars.status, (color) => ({
  vars: { [tone]: color },
}));
