import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import { z } from 'zod'
import type { DocumentBlock, DocumentContent, DocumentKind } from '@/lib/document-types'
import { periodEnd, splitBody, type ExperienceEntryRow } from '@/lib/experience'

/**
 * Overridable so a cheaper model can be tried without a deploy. Whichever
 * model answers is recorded on the document itself.
 */
const MODEL = process.env.RECAST_MODEL ?? 'claude-opus-5'

// Created on first use for the same reason as the database client: the build
// has no ANTHROPIC_API_KEY, and Next evaluates route modules while building.
let client: Anthropic | undefined
function getClient(): Anthropic {
  client ??= new Anthropic()
  return client
}

const Requirements = z.array(
  z.object({
    phrase: z.string(),
    entryIds: z.array(z.number().int()),
  }),
)

const Cited = z.object({ text: z.string(), entryIds: z.array(z.number().int()) })

const CvOutput = z.object({
  requirements: Requirements,
  headline: z.string(),
  summary: Cited,
  skills: z.array(z.object({ entryId: z.number().int(), items: z.string() })),
  experience: z.array(
    z.object({
      entryId: z.number().int(),
      sections: z.array(
        z.object({
          projectId: z.number().int(),
          bullets: z.array(Cited),
        }),
      ),
    }),
  ),
  projects: z.array(z.object({ entryId: z.number().int(), text: z.string() })),
})

const LetterOutput = z.object({
  requirements: Requirements,
  paragraphs: z.array(z.object({ label: z.string(), text: z.string(), entryIds: z.array(z.number().int()) })),
})

const SHARED = `Your only source of facts about the candidate is their experience library, given as numbered entries. The candidate reads everything you write before sending it, and every line shows which entries it came from. That provenance is the point of the tool, so:
- Every claim must be supported by the entries you cite for it. Rephrasing, condensing, selecting and reordering are your job; adding employers, dates, figures, technologies or outcomes the entries do not state is not.
- Leave out what the posting does not care about rather than padding. What the library cannot evidence surfaces as an unmatched requirement, which is more useful to the candidate than a vague claim.
- Entry periods are facts about time. A role whose period has ended is past: past tense, never "currently".

Write in English whatever language the posting is in. Plain, specific sentences; no filler such as "passionate", "results-driven" or "team player", and no personality claims the entries do not support.

requirements: the posting's distinct requirements (skills, experience, responsibilities), at most 12, most important first. Each phrase must be copied exactly from the posting, in the posting's own language, a few words long, so it can be located and underlined in the original text. entryIds are the entries that evidence it, or empty if none do. Evidence means the entries show the requirement itself: a neighbouring skill does not count, and a requirement naming several technologies is matched only if the entries cover the ones that matter to it.`

const SYSTEM: Record<DocumentKind, string> = {
  cv: `You tailor a CV to one job posting. The CV's layout, employers, dates, links, education and references are fixed and rendered by code; you choose and adapt the content that goes inside them.

${SHARED}

Style: match the library's own bullets — implied first person with no pronouns ("Built…", "Owned…", "Migrated…"), concrete nouns, no more than 35 words a bullet. In each bullet and in the summary, wrap the one to three terms a recruiter scanning for this posting should see in **double asterisks**. Bold nothing else.

What to produce:
- headline: the line under the candidate's name: a role title, then three to five technologies joined by " · ", chosen for this posting from technologies the library names. Example shape: "Frontend Engineer · React · Next.js · TypeScript".
- summary: three or four sentences positioning the candidate for this role, drawn from the work entries.
- skills: Key Skills rows. Each row is one skill entry (entryId) with its items, reordered so what the posting asks for comes first. You may drop items the posting has no use for; never add an item the entry does not list. Order rows by relevance and drop rows that do not help.
- experience: every work entry, newest first, each with sections. A section is either a project entry whose parent is that job (projectId = that project's id) or the job's own bullets (projectId = 0). Order a job's sections by relevance to the posting. Give each section two to five bullets adapted from that entry's bullets, most relevant first; a job's own section one to three. Older or less relevant jobs get fewer bullets. The CV must fit two A4 pages: about 16 experience bullets in total.
- projects: three to six standalone project entries (projects without a parent), most relevant to the posting first, each described in one sentence of at most 35 words adapted from its entry. The project's name and year print beside the sentence, so do not start with or repeat them.`,

  coverLetter: `You write the body of a cover letter for one job posting. The letterhead, date, salutation and sign-off are added by code.

${SHARED}

Do not state availability, notice period, contract type, rates, location preferences or willingness to relocate, even when the posting asks: those are the candidate's to state, and the library does not hold them. Do not generalise about the candidate's whole career ("how I have worked for most of my career") beyond what the entries show.

paragraphs: three or four paragraphs, 250 to 350 words in all — count them; a longer letter is a worse letter: why this role and this company (from the posting), one or two paragraphs of evidence from the library aimed at the posting's main requirements, and a short close. Label each paragraph by its purpose, e.g. "Opening", "Evidence", "Close". No salutation, no sign-off, no placeholders, no **bold**.`,
}

export type TailorPhase = 'reading' | 'matching' | 'drafting'

export interface TailorInput {
  kind: DocumentKind
  company: string
  role: string
  jobDescription: string
  entries: ExperienceEntryRow[]
}

export interface TailorResult {
  content: DocumentContent
  model: string
  inputTokens: number
  outputTokens: number
}

export class TailorError extends Error {}

const attr = (value: string) => value.replace(/"/g, '&quot;')

function renderEntries(entries: ExperienceEntryRow[]): string {
  const titles = new Map(entries.map((entry) => [entry.id, entry.title]))
  return entries
    .map((entry) => {
      const parent = entry.parentId ? ` parent="${entry.parentId}" parentTitle="${attr(titles.get(entry.parentId) ?? '')}"` : ''
      const period = entry.period ? ` period="${attr(entry.period)}"` : ''
      return `<entry id="${entry.id}" kind="${entry.kind}"${period}${parent}>\n<title>${entry.title}</title>\n${entry.body}\n</entry>`
    })
    .join('\n\n')
}

/**
 * Structured output guarantees the shape, not the prose inside a string. A
 * test run once ended a sentence with `','"'.replace(…` — the model sliding
 * into code at the end of a field. Cut at the first sign of that rather than
 * print it; normal prose never contains a quote-comma-quote or `.replace(`.
 */
function clean(text: string): string {
  const junk = text.search(/['"],\s*['"]|\.replace\(/)
  return (junk > 0 ? text.slice(0, junk) : text).trim().replace(/['"]+$/, '')
}

/** "Frontend Developer — Talksome" → "Talksome"; titles without an
 *  organisation fall back to the whole title. */
function organisation(title: string): string {
  const at = title.lastIndexOf(' — ')
  return at < 0 ? title : title.slice(at + 3)
}

function shortTitle(title: string): string {
  const at = title.indexOf(' — ')
  return at < 0 ? title : title.slice(0, at)
}

/**
 * Turns the model's structured CV into editable blocks, enforcing the
 * template: every work entry appears, newest first; a project section only
 * sits under the job that is its parent; ids the model made up are dropped.
 */
function cvBlocks(output: z.infer<typeof CvOutput>, entries: ExperienceEntryRow[]): DocumentBlock[] {
  const byId = new Map(entries.map((entry) => [entry.id, entry]))
  const cite = (ids: number[]) => [...new Set(ids)].filter((id) => byId.has(id))
  const blocks: DocumentBlock[] = []
  const add = (block: Omit<DocumentBlock, 'id' | 'edited'>) =>
    blocks.push({ ...block, id: `b${blocks.length + 1}`, edited: false })

  add({ label: 'Headline', format: 'line', text: clean(output.headline), sources: [], slot: { type: 'headline' } })
  add({
    label: 'Summary',
    format: 'paragraph',
    text: clean(output.summary.text),
    sources: cite(output.summary.entryIds),
    slot: { type: 'summary' },
  })

  const skillRows = output.skills.flatMap((row) => {
    const entry = byId.get(row.entryId)
    return entry?.kind === 'skill' && clean(row.items) ? [{ entry, items: clean(row.items) }] : []
  })
  const skills = skillRows.length
    ? skillRows
    : entries.filter((entry) => entry.kind === 'skill').map((entry) => ({ entry, items: entry.body }))
  add({
    label: 'Key skills',
    format: 'skills',
    text: skills.map((row) => `${row.entry.title}: ${row.items}`).join('\n'),
    sources: skills.map((row) => row.entry.id),
    slot: { type: 'skills' },
  })

  const jobs = entries
    .filter((entry) => entry.kind === 'work')
    .sort((a, b) => periodEnd(b.period) - periodEnd(a.period))

  for (const job of jobs) {
    const planned = output.experience.find((item) => item.entryId === job.id)
    const sections = (planned?.sections ?? []).filter((section) => {
      if (section.projectId === 0) return true
      return byId.get(section.projectId)?.parentId === job.id
    })

    // A job the model skipped still belongs on the CV; it gets its own
    // bullets as written rather than disappearing from the history.
    const fallback = !planned || sections.length === 0
    const usable = fallback
      ? [{ projectId: 0, bullets: splitBody(job.body).bullets.slice(0, 3).map((text) => ({ text, entryIds: [job.id] })) }]
      : sections

    // Project subsections first, the job's own bullets after them.
    const ordered = [...usable.filter((s) => s.projectId !== 0), ...usable.filter((s) => s.projectId === 0)]
    for (const section of ordered) {
      const bullets = section.bullets.map((bullet) => clean(bullet.text)).filter(Boolean)
      if (bullets.length === 0) continue
      const project = section.projectId ? byId.get(section.projectId) : undefined
      add({
        label: project ? `${organisation(job.title)} · ${shortTitle(project.title)}` : organisation(job.title),
        format: 'list',
        text: bullets.join('\n'),
        sources: cite([job.id, ...(project ? [project.id] : []), ...section.bullets.flatMap((bullet) => bullet.entryIds)]),
        slot: { type: 'job', entryId: job.id, projectId: project?.id ?? null },
      })
    }
  }

  const seen = new Set<number>()
  for (const item of output.projects) {
    const entry = byId.get(item.entryId)
    if (!entry || entry.kind !== 'project' || entry.parentId || seen.has(entry.id) || !clean(item.text)) continue
    seen.add(entry.id)
    add({
      label: `Project · ${entry.title}`,
      format: 'paragraph',
      text: clean(item.text),
      sources: [entry.id],
      slot: { type: 'project', entryId: entry.id },
    })
  }

  return blocks
}

function letterBlocks(output: z.infer<typeof LetterOutput>, entries: ExperienceEntryRow[]): DocumentBlock[] {
  const known = new Set(entries.map((entry) => entry.id))
  return output.paragraphs.map((paragraph, index) => ({
    id: `b${index + 1}`,
    label: paragraph.label,
    format: 'paragraph',
    text: clean(paragraph.text),
    sources: [...new Set(paragraph.entryIds)].filter((id) => known.has(id)),
    edited: false,
    slot: { type: 'letter' },
  }))
}

/**
 * One streamed call. Streaming is for the progress panel as much as for
 * timeouts: the phases it reports are the model's own (thinking, then
 * writing), not a timer pretending to know.
 */
/** `signal` aborts the API call itself, so a cancelled run stops generating
 *  (and billing) rather than finishing unseen. */
export async function tailor(
  input: TailorInput,
  onPhase: (phase: TailorPhase) => void,
  signal?: AbortSignal,
): Promise<TailorResult> {
  const known = new Set(input.entries.map((entry) => entry.id))

  onPhase('reading')
  const stream = getClient().beta.messages.stream({
    model: MODEL,
    max_tokens: 32000,
    // A classifier decline is re-run on Anthropic's recommended fallback
    // model instead of failing the request.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: SYSTEM[input.kind],
    output_config: { format: input.kind === 'cv' ? betaZodOutputFormat(CvOutput) : betaZodOutputFormat(LetterOutput) },
    messages: [
      {
        role: 'user',
        content:
          `<experience_library>\n${renderEntries(input.entries)}\n</experience_library>\n\n` +
          `<posting company="${attr(input.company)}" role="${attr(input.role)}">\n${input.jobDescription}\n</posting>\n\n` +
          `Today is ${new Date().toISOString().slice(0, 10)}.`,
      },
    ],
  }, { signal })

  let phase: TailorPhase = 'reading'
  const advance = (next: TailorPhase) => {
    if (next === phase) return
    phase = next
    onPhase(next)
  }
  // Keyed on block starts, not deltas: thinking text is omitted by default, so
  // thinking deltas may never arrive even while the model is thinking.
  stream.on('streamEvent', (event) => {
    if (event.type !== 'content_block_start') return
    if (event.content_block.type === 'thinking') advance('matching')
    if (event.content_block.type === 'text') advance('drafting')
  })

  const message = await stream.finalMessage()

  if (message.stop_reason === 'refusal') {
    throw new TailorError('The model declined this request. Nothing was saved.')
  }
  if (message.stop_reason === 'max_tokens') {
    throw new TailorError('The response was cut off before it finished. Nothing was saved.')
  }
  const output = message.parsed_output as z.infer<typeof CvOutput> | z.infer<typeof LetterOutput> | null
  if (!output) {
    throw new TailorError('The response did not match the expected shape. Nothing was saved.')
  }

  const requirements = output.requirements.map((requirement) => ({
    phrase: requirement.phrase,
    sources: [...new Set(requirement.entryIds)].filter((id) => known.has(id)),
  }))
  const blocks =
    input.kind === 'cv'
      ? cvBlocks(output as z.infer<typeof CvOutput>, input.entries)
      : letterBlocks(output as z.infer<typeof LetterOutput>, input.entries)

  return {
    content: { requirements, blocks },
    model: message.model,
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
  }
}
