import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ImportPreview as Preview } from '@/lib/import-cv'

const sdk = vi.hoisted(() => ({ stream: vi.fn() }))

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    static AnthropicError = class extends Error {}
    beta = { messages: { stream: sdk.stream } }
  },
}))

const { default: Anthropic } = await import('@anthropic-ai/sdk')
const { importCv, ImportError, ImportPreview } = await import('@/lib/import-cv')

type StreamEvent = { type: 'message_delta'; delta: { stop_reason: string } }

function fakeStream(message: object, events: StreamEvent[] = [], error?: Error) {
  let listener: ((event: StreamEvent) => void) | undefined
  return {
    on: (_name: string, callback: (event: StreamEvent) => void) => {
      listener = callback
    },
    finalMessage: async () => {
      for (const event of events) listener?.(event)
      if (error) throw error
      return { stop_reason: 'end_turn', ...message }
    },
  }
}

const entry = (key: string, kind: 'work' | 'project' | 'skill' | 'achievement', parentKey = '') => ({
  key,
  kind,
  title: key,
  period: '',
  body: '',
  links: '',
  parentKey,
})

const preview: Preview = {
  profile: {
    name: 'Jane Doe',
    headline: '',
    contact: [],
    links: [],
    portfolio: { text: '', label: '', url: '' },
    education: '',
    quotes: [{ entryTitle: 'e1', text: 'Great work.', attribution: ' — A. Manager' }],
  },
  entries: [entry('e1', 'work'), entry('e2', 'project', 'e1'), entry('e3', 'project', 'e4'), entry('e4', 'skill'), entry('e5', 'project', 'e9')],
}

beforeEach(() => sdk.stream.mockReset())

describe('importCv', () => {
  it('keeps parents that are jobs and makes other projects standalone', async () => {
    sdk.stream.mockReturnValue(fakeStream({ parsed_output: preview }))
    const result = await importCv({ type: 'text', text: 'CV' }, () => {})

    expect(result.entries.map((item) => [item.key, item.parentKey])).toEqual([
      ['e1', ''],
      ['e2', 'e1'],
      ['e3', ''],
      ['e4', ''],
      ['e5', ''],
    ])
  })

  it('strips a leading dash from quote attributions', async () => {
    sdk.stream.mockReturnValue(fakeStream({ parsed_output: preview }))
    const result = await importCv({ type: 'text', text: 'CV' }, () => {})

    expect(result.profile.quotes[0]!.attribution).toBe('A. Manager')
  })

  it('sends a PDF as a document block', async () => {
    sdk.stream.mockReturnValue(fakeStream({ parsed_output: preview }))
    await importCv({ type: 'pdf', base64: 'JVBERi0=' }, () => {})

    const [document] = sdk.stream.mock.calls[0]![0].messages[0].content
    expect(document).toEqual({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: 'JVBERi0=' } })
  })

  it.each([
    [{ stop_reason: 'refusal', parsed_output: preview }, 'declined'],
    [{ stop_reason: 'max_tokens', parsed_output: null }, 'too long'],
    [{ parsed_output: null }, 'expected shape'],
  ])('rejects an unusable response (%o)', async (message, reason) => {
    sdk.stream.mockReturnValue(fakeStream(message))
    const run = importCv({ type: 'text', text: 'CV' }, () => {})

    await expect(run).rejects.toBeInstanceOf(ImportError)
    await expect(run).rejects.toThrow(reason)
  })

  it('explains a cut-off CV the SDK could not parse', async () => {
    const error = new Anthropic.AnthropicError('Failed to parse structured output: SyntaxError')
    sdk.stream.mockReturnValue(fakeStream({}, [{ type: 'message_delta', delta: { stop_reason: 'max_tokens' } }], error))
    const run = importCv({ type: 'text', text: 'CV' }, () => {})

    await expect(run).rejects.toBeInstanceOf(ImportError)
    await expect(run).rejects.toThrow('too long')
  })
})

describe('ImportPreview', () => {
  it('rejects an unknown entry kind sent back from the browser', () => {
    const tampered = { ...preview, entries: [{ ...entry('e1', 'work'), kind: 'hobby' }] }
    expect(ImportPreview.safeParse(tampered).success).toBe(false)
  })
})
