import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import { z } from 'zod'
import type { DocumentContent, DocumentKind } from '@/lib/documents'
import type { ExperienceEntryRow } from '@/lib/experience'

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

const TailorOutput = z.object({
  requirements: z.array(
    z.object({
      phrase: z.string(),
      entryIds: z.array(z.number().int()),
    }),
  ),
  blocks: z.array(
    z.object({
      label: z.string(),
      format: z.enum(['paragraph', 'list']),
      text: z.string(),
      entryIds: z.array(z.number().int()),
    }),
  ),
})

const SYSTEM = `You tailor a candidate's CV or cover letter to one job posting. Your only source of facts about the candidate is their experience library, given as numbered entries.

The candidate reads everything you write before sending it, and each block shows which entries it came from. That provenance is the point of the tool, so:
- Every claim must be supported by the entries you cite for that block. Do not add employers, dates, figures, technologies or outcomes the entries do not state. Rephrasing and selecting are your job; inventing is not.
- If the posting asks for something the library does not cover, leave it out of the text. It will surface as an unmatched requirement, which is more useful to the candidate than a vague claim.
- In each block's entryIds, list every entry the block draws on. A block that draws on nothing should not exist.

- Entry periods are facts about time. A role whose period has ended is past: describe it in the past tense and never as current.

requirements: the posting's distinct requirements (skills, experience, responsibilities), at most 12, most important first. Each phrase must be copied exactly from the posting, a few words long, so it can be located and underlined in the original text. entryIds are the entries that evidence it, or empty if none do. Evidence means the entries show the requirement itself: a neighbouring skill does not count, and a requirement naming several technologies is matched only if the entries cover the ones that matter to it.

Write in the language the posting is written in, including block labels. Plain, specific sentences; no filler such as "passionate", "results-driven" or "team player", and no personality claims the entries do not support. For a list block, put one item per line with no bullet characters.`

const INSTRUCTIONS: Record<DocumentKind, string> = {
  cv: `Write the tailored sections of a CV, as three blocks in this order:
1. A summary: a paragraph of two or three sentences positioning the candidate for this role.
2. Selected experience: a list of three to six items, most relevant to this posting first. Each item is one sentence naming what was done and where.
3. Skills ordered for this posting: a paragraph listing skills from the library separated by " · ", most relevant first. Only skills the entries name.`,
  coverLetter: `Write the body of a cover letter, under 300 words, as three or four paragraph blocks: why this role, one or two paragraphs of evidence from the library aimed at the posting's main requirements, and a short close. No salutation, no sign-off and no placeholders; the candidate adds those. Label each block by its purpose, e.g. "Opening", "Evidence", "Close".`,
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

function renderEntries(entries: ExperienceEntryRow[]): string {
  return entries
    .map(
      (entry) =>
        `<entry id="${entry.id}" kind="${entry.kind}"${entry.period ? ` period="${entry.period}"` : ''}>\n` +
        `<title>${entry.title}</title>\n${entry.body}\n</entry>`,
    )
    .join('\n\n')
}

/**
 * One streamed call. Streaming is for the progress panel as much as for
 * timeouts: the phases it reports are the model's own (thinking, then
 * writing), not a timer pretending to know.
 */
export async function tailor(input: TailorInput, onPhase: (phase: TailorPhase) => void): Promise<TailorResult> {
  const known = new Set(input.entries.map((entry) => entry.id))

  onPhase('reading')
  const stream = getClient().beta.messages.stream({
    model: MODEL,
    max_tokens: 32000,
    // A classifier decline is re-run on Anthropic's recommended fallback
    // model instead of failing the request.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: SYSTEM,
    output_config: { format: betaZodOutputFormat(TailorOutput) },
    messages: [
      {
        role: 'user',
        content:
          `<experience_library>\n${renderEntries(input.entries)}\n</experience_library>\n\n` +
          `<posting company="${input.company}" role="${input.role}">\n${input.jobDescription}\n</posting>\n\n` +
          `Today is ${new Date().toISOString().slice(0, 10)}.\n\n` +
          INSTRUCTIONS[input.kind],
      },
    ],
  })

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
  const output = message.parsed_output
  if (!output) {
    throw new TailorError('The response did not match the expected shape. Nothing was saved.')
  }

  // Ids the model made up are dropped rather than trusted: a provenance line
  // naming an entry that does not exist is worse than a shorter one.
  const cite = (ids: number[]) => [...new Set(ids)].filter((id) => known.has(id))

  return {
    content: {
      requirements: output.requirements.map((requirement) => ({
        phrase: requirement.phrase,
        sources: cite(requirement.entryIds),
      })),
      blocks: output.blocks.map((block, index) => ({
        id: `b${index + 1}`,
        label: block.label,
        format: block.format,
        text: block.text.trim(),
        sources: cite(block.entryIds),
        edited: false,
      })),
    },
    model: message.model,
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
  }
}
