/**
 * Status: the five pipeline stages, their labels, and their glyphs.
 *
 * The glyph is not decoration. It is the second channel that carries status
 * when hue fails - greyscale, colour blindness, a bad monitor - so a status
 * must never be rendered as colour alone. Every glyph is built from one
 * primitive, a circle: opened, filled, halved, doubled, struck.
 */
export const STATUS_ORDER = ['saved', 'applied', 'interview', 'offer', 'rejected'] as const;
export type Status = (typeof STATUS_ORDER)[number];

export const STATUS_LABEL: Record<Status, string> = {
  saved: 'Saved',
  applied: 'Applied',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
};

/** Statuses an application can still move forward from. */
export const OPEN_STATUSES: Status[] = ['saved', 'applied', 'interview'];

export type GlyphShape =
  | { kind: 'circle'; cx: number; cy: number; r: number; filled?: boolean; strokeWidth?: number }
  | { kind: 'path'; d: string; filled?: boolean; strokeWidth?: number };

export const GLYPH_VIEWBOX = '0 0 14 14';

/** Render at 14px in the column header and badge; currentColor is the tone. */
export const STATUS_GLYPH: Record<Status, GlyphShape[]> = {
  // open ring - nothing committed yet
  saved: [{ kind: 'circle', cx: 7, cy: 7, r: 4.2, strokeWidth: 1.4 }],
  // filled - the application is out
  applied: [{ kind: 'circle', cx: 7, cy: 7, r: 4.2, filled: true }],
  // half filled - in progress, both sides deciding
  interview: [
    { kind: 'circle', cx: 7, cy: 7, r: 4.2, strokeWidth: 1.4 },
    { kind: 'path', d: 'M7 2.8a4.2 4.2 0 0 1 0 8.4z', filled: true },
  ],
  // ringed - the only status with an outer mark
  offer: [
    { kind: 'circle', cx: 7, cy: 7, r: 5.3, strokeWidth: 1.1 },
    { kind: 'circle', cx: 7, cy: 7, r: 2.5, filled: true },
  ],
  // struck - closed, kept for the duplicate check
  rejected: [
    { kind: 'circle', cx: 7, cy: 7, r: 4.2, strokeWidth: 1.4 },
    { kind: 'path', d: 'M4 10 10 4', strokeWidth: 1.4 },
  ],
};

/** The external-link mark shown when a posting URL was saved. Needs
 *  visually hidden text beside it - a title attribute is not enough. */
export const EXTERNAL_MARK = {
  viewBox: '0 0 10 10',
  d: 'M2.6 7.4 7.4 2.6M4.2 2.6h3.2v3.2',
  strokeWidth: 1.2,
};
