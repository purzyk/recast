export interface Segment {
  text: string
  matched: boolean
}

/**
 * Splits text so the given phrases can be underlined. Case-insensitive,
 * first occurrence of each phrase only, and overlaps resolve to whichever
 * starts first. Phrases the model paraphrased instead of quoting simply
 * find nothing, which is why the requirement count is shown separately.
 */
export function highlight(text: string, phrases: string[]): Segment[] {
  const lower = text.toLowerCase()
  const ranges = phrases
    .map((phrase) => phrase.trim())
    .filter(Boolean)
    .map((phrase) => {
      const start = lower.indexOf(phrase.toLowerCase())
      return { start, end: start + phrase.length }
    })
    .filter((range) => range.start >= 0)
    .sort((a, b) => a.start - b.start || b.end - a.end)

  const segments: Segment[] = []
  let cursor = 0
  for (const range of ranges) {
    if (range.start < cursor) continue
    if (range.start > cursor) segments.push({ text: text.slice(cursor, range.start), matched: false })
    segments.push({ text: text.slice(range.start, range.end), matched: true })
    cursor = range.end
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), matched: false })
  return segments
}
