import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import { z } from 'zod'
import { EXPERIENCE_KINDS } from '@/lib/experience-kinds'
import type { TailorPhase } from '@/lib/tailor'

const MODEL = process.env.RECAST_MODEL ?? 'claude-opus-5'

let client: Anthropic | undefined
function getClient(): Anthropic {
  client ??= new Anthropic()
  return client
}

/**
 * What an import produces, before anything is saved. The same schema checks
 * the model's output and, on save, the preview the browser sends back — which
 * is client data and trusted no more than any other form post.
 */
export const ImportPreview = z.object({
  profile: z.object({
    name: z.string(),
    headline: z.string(),
    contact: z.array(z.string()),
    links: z.array(z.object({ label: z.string(), url: z.string() })),
    portfolio: z.object({ text: z.string(), label: z.string(), url: z.string() }),
    education: z.string(),
    quotes: z.array(z.object({ entryTitle: z.string(), text: z.string(), attribution: z.string() })),
  }),
  entries: z.array(
    z.object({
      key: z.string(),
      kind: z.enum(EXPERIENCE_KINDS),
      title: z.string(),
      period: z.string(),
      body: z.string(),
      links: z.string(),
      parentKey: z.string(),
    }),
  ),
})
export type ImportPreview = z.infer<typeof ImportPreview>

const SYSTEM = `You turn a CV into structured data for a CV-tailoring tool. The tool later picks and adapts bullets from this data for each job posting, and prints the parts that never change (name, contact, employers, dates, education) exactly as you record them here.

You are restructuring, not rewriting. Keep the CV's own wording for bullets and descriptions; fix only obvious typos. Never add facts, figures, technologies or dates that are not in the CV. If something is missing, leave the field empty.

profile:
- name, headline (the line under the name, or empty), contact (location, email, phone, languages — one item each), links (LinkedIn, GitHub and similar, with the visible label and the full URL).
- portfolio: if the CV points to a personal portfolio site, its URL, a short label (the hostname) and the sentence introducing it, or "Portfolio:" if there is none; otherwise all three empty.
- education: one line in the CV's words; wrap the institution in **double asterisks**.
- quotes: recommendations or references quoted in the CV, each with its attribution and entryTitle — the exact title you gave the work entry it belongs under.

entries — one per item, each with a short unique key (e1, e2, …):
- work: one per job or merged period of jobs as the CV presents them. title "Role — Organisation" (just the role if there is no organisation). period as the CV gives it, with location after " · " when stated. body: the job's intro sentence(s) if any, then one line per bullet starting with "- ".
- project: a named product or project described inside a job becomes its own project entry with parentKey set to that job's key; its body is "- " bullets. A subheading inside a job that is not a product — "Engineering practice", "Responsibilities", "Key achievements" — is not a project: its bullets belong to the job's own body. Standalone projects (a "Projects" or "Selected work" section) have an empty parentKey; their body is the CV's one or two sentences about them.
- Titles are names only. A year goes in period, a URL or domain in links — "Grid Architekci (2026) — grid.net.pl" is title "Grid Architekci", period "2026".
- skill: one entry per skills group. title is the group's label, body its items separated by commas, as listed. If the CV lists skills without groups, group them under short labels such as "Core", "Frameworks", "Testing", "Tooling".
- achievement: awards, certifications and similar that are not bullets of a job.
- links: one "label url" per line for links the CV attaches to that entry (company site, case study, demo, repository); empty if none. Use full URLs; add https:// when the CV omits it.

Record a URL only when its address is written out in the CV (as text, or as the visible label such as "grid.net.pl"). A link shown only as a word — "case study", "live demo", a company name — has no address you can see, especially in a PDF: leave it out rather than guess. A wrong link on a CV is worse than a missing one.

name in normal capitalisation ("Jane Doe", not "JANE DOE"). Quote attributions without a leading dash.`

export class ImportError extends Error {}

export type ImportSource = { type: 'text'; text: string } | { type: 'pdf'; base64: string }

export async function importCv(
  source: ImportSource,
  onPhase: (phase: TailorPhase) => void,
  signal?: AbortSignal,
): Promise<ImportPreview> {
  onPhase('reading')

  const content: Anthropic.Beta.BetaContentBlockParam[] =
    source.type === 'pdf'
      ? [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: source.base64 } },
          { type: 'text', text: 'Structure the CV above.' },
        ]
      : [{ type: 'text', text: `<cv>\n${source.text}\n</cv>\n\nStructure the CV above.` }]

  const stream = getClient().beta.messages.stream({
    model: MODEL,
    max_tokens: 32000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: SYSTEM,
    output_config: { format: betaZodOutputFormat(ImportPreview) },
    messages: [{ role: 'user', content }],
  }, { signal })

  let phase: TailorPhase = 'reading'
  stream.on('streamEvent', (event) => {
    if (event.type !== 'content_block_start') return
    const next = event.content_block.type === 'thinking' ? 'matching' : event.content_block.type === 'text' ? 'drafting' : phase
    if (next !== phase) {
      phase = next
      onPhase(next)
    }
  })

  const message = await stream.finalMessage()
  if (message.stop_reason === 'refusal') throw new ImportError('The model declined to read this document.')
  if (message.stop_reason === 'max_tokens') throw new ImportError('The CV was too long to read in one go.')
  if (!message.parsed_output) throw new ImportError('The response did not match the expected shape.')

  const preview = message.parsed_output
  const keys = new Set(preview.entries.map((entry) => entry.key))
  const workKeys = new Set(preview.entries.filter((entry) => entry.kind === 'work').map((entry) => entry.key))
  return {
    ...preview,
    profile: {
      ...preview.profile,
      quotes: preview.profile.quotes.map((quote) => ({ ...quote, attribution: quote.attribution.replace(/^[\s—–-]+/, '') })),
    },
    // A parent must be a job that exists; anything else becomes standalone.
    entries: preview.entries.map((entry) => ({
      ...entry,
      parentKey: keys.has(entry.parentKey) && workKeys.has(entry.parentKey) ? entry.parentKey : '',
    })),
  }
}
