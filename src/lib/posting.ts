/**
 * A pasted job posting has structure, but every job board flattens it
 * differently: dashed bullets split by blank lines, one bullet per paragraph,
 * or a stack of one-word technology names under a "Required" line. Rendering
 * the raw text either runs it together or spaces every line apart, so this
 * reads the structure back out of the plain text. It only ever regroups the
 * author's lines; no text is added or reworded.
 */
export type PostingBlock =
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'tags'; label?: string; items: string[] }

const DASH = /^[-•*·–—]\s*/

/**
 * Section names job boards use, Polish and English. Shape alone cannot tell
 * "Requirements" from a terse bullet like "Elastyczne godziny pracy", so a
 * short line only becomes a heading if it names a section or ends like one.
 */
const SECTION =
  /\b(about|responsibilit|requirement|expect|offer|benefit|perks|tasks|nice to have|tech stack|technolog|who you are|what you|contract|summary|zakres|obowiąz|wymagan|oczekiwan|oferuj|oferta|benefity|zadania|mile widziane|jak pracujemy|rozwin|o projekcie|o nas|o firmie|o roli|kogo szukamy)/i

/** Sub-labels inside a technology list: they label tags when tags follow. */
const TAG_LABEL = /^(wymagane|mile widziane|required|nice to have|optional)$/i

/** Sections that introduce rather than enumerate: their lines are prose. */
const PROSE_SECTION = /^(about|o projekcie|o nas|o firmie|o roli)/i

/** JustJoin prints its tech stack as a technology, then its level on the next line. */
const TECH_STACK = /^tech stack$/i
const LEVEL = /^(junior|regular|advanced|master|senior|beginner|intermediate|nice to have|[abc][12])$/i

/** Longer than this, a line is prose even among short ones. */
const LIST_ITEM_MAX = 200

const words = (line: string) => line.split(/\s+/).filter(Boolean).length

function isHeading(line: string): boolean {
  if (DASH.test(line) || line.length > 50 || words(line) > 7) return false
  if (/[.,;!]$/.test(line) || /:\s*\S/.test(line) || !/^\p{Lu}/u.test(line)) return false
  return SECTION.test(line) || /[:?]$/.test(line)
}

/** A technology name: "React.js", "Tailwind CSS", "REST API". */
const isTag = (line: string) => line.length <= 30 && words(line) <= 3 && !/[.,;:!?]$/.test(line)

export function parsePosting(text: string): PostingBlock[] {
  const lines = text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const blocks: PostingBlock[] = []
  let section: string | undefined
  let label: string | undefined
  let pending: string[] = []

  const pushTags = (items: string[]) => {
    const last = blocks.at(-1)
    if (last?.kind === 'tags' && last.label?.toLowerCase() === label?.toLowerCase()) last.items.push(...items)
    else blocks.push({ kind: 'tags', label, items: [...items] })
  }

  // A run of plain lines is decided as a whole: technology names become
  // tags, short lines under a heading a list, anything else prose.
  const flush = () => {
    const group = pending
    pending = []
    if (group.length > 0 && group.every(isTag) && (label || group.length >= 3)) {
      pushTags(group)
    } else {
      if (label) blocks.push({ kind: 'heading', text: label })
      const prose =
        !section || PROSE_SECTION.test(section) || group.some((line) => line.length > LIST_ITEM_MAX)
      if (group.length > 1 && !prose) blocks.push({ kind: 'list', items: group })
      else for (const line of group) blocks.push({ kind: 'paragraph', text: line })
    }
    label = undefined
  }

  const heading = (text: string) => {
    blocks.push({ kind: 'heading', text })
    section = text
  }

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]!

    if (TECH_STACK.test(line)) {
      flush()
      heading(line)
      const items: string[] = []
      while (index + 2 < lines.length && LEVEL.test(lines[index + 2]!)) {
        items.push(`${lines[index + 1]} · ${lines[index + 2]}`)
        index += 2
      }
      if (items.length > 0) blocks.push({ kind: 'tags', items })
    } else if (DASH.test(line)) {
      flush()
      const item = line.replace(DASH, '')
      const last = blocks.at(-1)
      if (last?.kind === 'list') last.items.push(item)
      else blocks.push({ kind: 'list', items: [item] })
    } else if (isHeading(line)) {
      flush()
      const name = line.replace(/:$/, '')
      if (TAG_LABEL.test(name)) label = name
      else heading(name)
    } else {
      pending.push(line)
    }
  }
  flush()

  // Dashed technology lists arrive as bullets; they read better as tags.
  // Boards also repeat a technology across their own sections: show it once.
  return blocks.map((block) => {
    if (block.kind === 'list' && block.items.length >= 4 && block.items.every(isTag)) {
      return { kind: 'tags', items: [...new Set(block.items)] }
    }
    if (block.kind === 'tags') return { ...block, items: [...new Set(block.items)] }
    return block
  })
}
