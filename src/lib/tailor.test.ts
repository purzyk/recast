import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ExperienceEntryRow } from '@/lib/experience'

const sdk = vi.hoisted(() => ({ stream: vi.fn() }))

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    static AnthropicError = class extends Error {}
    beta = { messages: { stream: sdk.stream } }
  },
}))

const { default: Anthropic } = await import('@anthropic-ai/sdk')
const { tailor, TailorError } = await import('@/lib/tailor')

type StreamEvent =
  | { type: 'content_block_start'; content_block: { type: string } }
  | { type: 'message_delta'; delta: { stop_reason: string } }

function fakeStream(message: object, events: StreamEvent[] = [], error?: Error) {
  let listener: ((event: StreamEvent) => void) | undefined
  return {
    on: (_name: string, callback: (event: StreamEvent) => void) => {
      listener = callback
    },
    finalMessage: async () => {
      for (const event of events) listener?.(event)
      if (error) throw error
      return { model: 'claude-test', usage: { input_tokens: 100, output_tokens: 50 }, stop_reason: 'end_turn', ...message }
    },
  }
}

const parseError = () => new Anthropic.AnthropicError('Failed to parse structured output: SyntaxError')

const entry = (overrides: Partial<ExperienceEntryRow> & Pick<ExperienceEntryRow, 'id' | 'kind' | 'title'>): ExperienceEntryRow => ({
  period: null,
  body: '',
  links: null,
  parentId: null,
  updatedAt: new Date(0),
  ...overrides,
})

const entries = [
  entry({ id: 1, kind: 'work', title: 'Developer — Oldco', period: '2015 – 2018', body: '- Old one\n- Old two\n- Old three\n- Old four' }),
  entry({ id: 2, kind: 'work', title: 'Frontend Engineer — Newco', period: '2020 – present', body: 'Intro.\n- New one' }),
  entry({ id: 3, kind: 'project', title: 'Board — the pipeline view', parentId: 2, body: '- Built it' }),
  entry({ id: 4, kind: 'project', title: 'Side project', period: '2024' }),
  entry({ id: 5, kind: 'skill', title: 'Frontend', body: 'React, TypeScript' }),
  entry({ id: 6, kind: 'project', title: 'Belongs to Oldco', parentId: 1 }),
]

const cvOutput = {
  requirements: [{ phrase: 'React', entryIds: [5, 5, 99] }],
  headline: 'Frontend Engineer · React',
  summary: { text: 'Builds interfaces.', entryIds: [2, 2, 42] },
  skills: [
    { entryId: 5, items: 'React, TypeScript' },
    { entryId: 2, items: 'not a skill entry' },
  ],
  experience: [
    {
      entryId: 2,
      sections: [
        { projectId: 0, bullets: [{ text: 'Owned the **frontend**', entryIds: [2] }] },
        { projectId: 3, bullets: [{ text: 'Built the board', entryIds: [3] }] },
        { projectId: 6, bullets: [{ text: 'Misplaced project', entryIds: [6] }] },
      ],
    },
  ],
  projects: [
    { entryId: 4, text: 'A tool I use daily.' },
    { entryId: 4, text: 'Duplicate.' },
    { entryId: 3, text: 'Has a parent, so not standalone.' },
  ],
}

const input = { kind: 'cv' as const, company: 'Acme "Labs"', role: 'Engineer', jobDescription: 'We need React.', entries }

beforeEach(() => sdk.stream.mockReset())

describe('tailor', () => {
  it('reports phases from the stream, once each', async () => {
    const start = (type: string): StreamEvent => ({ type: 'content_block_start', content_block: { type } })
    sdk.stream.mockReturnValue(fakeStream({ parsed_output: cvOutput }, [start('thinking'), start('thinking'), start('text')]))

    const phases: string[] = []
    await tailor(input, (phase) => phases.push(phase))

    expect(phases).toEqual(['reading', 'matching', 'drafting'])
  })

  it('sends the library and escapes attribute values in the posting', async () => {
    sdk.stream.mockReturnValue(fakeStream({ parsed_output: cvOutput }))
    await tailor(input, () => {})

    const content: string = sdk.stream.mock.calls[0]![0].messages[0].content
    expect(content).toContain('<entry id="3" kind="project" parent="2" parentTitle="Frontend Engineer — Newco">')
    expect(content).toContain('<posting company="Acme &quot;Labs&quot;" role="Engineer">')
  })

  it('drops cited ids that are not in the library and deduplicates the rest', async () => {
    sdk.stream.mockReturnValue(fakeStream({ parsed_output: cvOutput }))
    const { content } = await tailor(input, () => {})

    expect(content.requirements).toEqual([{ phrase: 'React', sources: [5] }])
    expect(content.blocks.find((block) => block.slot?.type === 'summary')?.sources).toEqual([2])
  })

  it('builds the CV in template order and keeps every job, newest first', async () => {
    sdk.stream.mockReturnValue(fakeStream({ parsed_output: cvOutput }))
    const { content, model, inputTokens, outputTokens } = await tailor(input, () => {})

    expect(content.blocks.map((block) => block.label)).toEqual([
      'Headline',
      'Summary',
      'Key skills',
      'Newco · Board',
      'Newco',
      'Oldco',
      'Project · Side project',
    ])
    expect(content.blocks.map((block) => block.id)).toEqual(['b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7'])
    expect({ model, inputTokens, outputTokens }).toEqual({ model: 'claude-test', inputTokens: 100, outputTokens: 50 })
  })

  it('only keeps skill rows that point at skill entries', async () => {
    sdk.stream.mockReturnValue(fakeStream({ parsed_output: cvOutput }))
    const { content } = await tailor(input, () => {})

    const skills = content.blocks.find((block) => block.slot?.type === 'skills')
    expect(skills).toMatchObject({ text: 'Frontend: React, TypeScript', sources: [5] })
  })

  it('falls back to the library skills when the model gives none that fit', async () => {
    sdk.stream.mockReturnValue(fakeStream({ parsed_output: { ...cvOutput, skills: [] } }))
    const { content } = await tailor(input, () => {})

    expect(content.blocks.find((block) => block.slot?.type === 'skills')?.text).toBe('Frontend: React, TypeScript')
  })

  it('ignores a project placed under a job that is not its parent', async () => {
    sdk.stream.mockReturnValue(fakeStream({ parsed_output: cvOutput }))
    const { content } = await tailor(input, () => {})

    expect(content.blocks.some((block) => block.text.includes('Misplaced project'))).toBe(false)
  })

  it('gives a job the model skipped its first three bullets as written', async () => {
    sdk.stream.mockReturnValue(fakeStream({ parsed_output: cvOutput }))
    const { content } = await tailor(input, () => {})

    expect(content.blocks.find((block) => block.label === 'Oldco')).toMatchObject({
      text: 'Old one\nOld two\nOld three',
      sources: [1],
      slot: { type: 'job', entryId: 1, projectId: null },
    })
  })

  it('cuts text where the model slides into code', async () => {
    const output = { ...cvOutput, headline: `Frontend Engineer', '"'.replace(/x/, '')` }
    sdk.stream.mockReturnValue(fakeStream({ parsed_output: output }))
    const { content } = await tailor(input, () => {})

    expect(content.blocks[0]!.text).toBe('Frontend Engineer')
  })

  it('builds a cover letter from paragraphs', async () => {
    const letter = {
      requirements: [],
      paragraphs: [
        { label: 'Opening', text: 'Dear reader.', entryIds: [2, 404] },
        { label: 'Close', text: 'Thanks.', entryIds: [] },
      ],
    }
    sdk.stream.mockReturnValue(fakeStream({ parsed_output: letter }))
    const { content } = await tailor({ ...input, kind: 'coverLetter' }, () => {})

    expect(content.blocks).toEqual([
      { id: 'b1', label: 'Opening', format: 'paragraph', text: 'Dear reader.', sources: [2], edited: false, slot: { type: 'letter' } },
      { id: 'b2', label: 'Close', format: 'paragraph', text: 'Thanks.', sources: [], edited: false, slot: { type: 'letter' } },
    ])
  })

  it.each([
    [{ stop_reason: 'refusal', parsed_output: cvOutput }, 'declined'],
    [{ stop_reason: 'max_tokens', parsed_output: null }, 'cut off'],
    [{ parsed_output: null }, 'expected shape'],
  ])('rejects an unusable response (%o)', async (message, reason) => {
    sdk.stream.mockReturnValue(fakeStream(message))
    const run = tailor(input, () => {})

    await expect(run).rejects.toBeInstanceOf(TailorError)
    await expect(run).rejects.toThrow(reason)
  })

  it.each([
    ['max_tokens', 'cut off'],
    ['refusal', 'declined'],
    ['end_turn', 'expected shape'],
  ])('explains partial output the SDK could not parse (%s)', async (stopReason, reason) => {
    sdk.stream.mockReturnValue(fakeStream({}, [{ type: 'message_delta', delta: { stop_reason: stopReason } }], parseError()))
    const run = tailor(input, () => {})

    await expect(run).rejects.toBeInstanceOf(TailorError)
    await expect(run).rejects.toThrow(reason)
  })

  it('passes API errors through for the route to describe', async () => {
    const error = new Error('overloaded')
    sdk.stream.mockReturnValue(fakeStream({}, [], error))

    await expect(tailor(input, () => {})).rejects.toBe(error)
  })
})
