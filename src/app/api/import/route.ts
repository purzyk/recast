import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/auth'
import { importCv, ImportError, type ImportPreview, type ImportSource } from '@/lib/import-cv'
import type { TailorPhase } from '@/lib/tailor'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const MAX_PDF_BYTES = 10 * 1024 * 1024
const MAX_TEXT_CHARS = 60_000

export type ImportEvent =
  | { type: 'phase'; phase: TailorPhase }
  | { type: 'done'; preview: ImportPreview }
  | { type: 'error'; message: string }

function describe(error: unknown): string {
  if (error instanceof ImportError) return error.message
  if (error instanceof Anthropic.AuthenticationError) return 'The Anthropic API key is missing or invalid.'
  if (error instanceof Anthropic.RateLimitError) return 'Rate limited by the Anthropic API. Try again in a minute.'
  if (error instanceof Anthropic.APIError) return `Anthropic API error ${error.status ?? ''}: ${error.message}`.trim()
  return 'Reading the CV failed unexpectedly.'
}

/**
 * Reads a CV into a preview. Nothing is saved here: the preview goes back to
 * the browser, the user decides, and saving is a separate action.
 */
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return new Response('Unauthorized', { status: 401 })

  const form = await request.formData().catch(() => null)
  if (!form) return new Response('Bad request', { status: 400 })

  const file = form.get('file')
  const text = String(form.get('text') ?? '').trim()

  let source: ImportSource
  if (file instanceof File && file.size > 0) {
    if (file.type !== 'application/pdf') return new Response('Only PDF files are supported', { status: 415 })
    if (file.size > MAX_PDF_BYTES) return new Response('PDF is larger than 10 MB', { status: 413 })
    source = { type: 'pdf', base64: Buffer.from(await file.arrayBuffer()).toString('base64') }
  } else if (text) {
    if (text.length > MAX_TEXT_CHARS) return new Response('Text is too long', { status: 413 })
    source = { type: 'text', text }
  } else {
    return new Response('Paste the CV or choose a PDF', { status: 400 })
  }

  // Same cancellation path as tailoring: a cancelled import stops the API call.
  const abort = new AbortController()
  request.signal.addEventListener('abort', () => abort.abort())

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    cancel() {
      abort.abort()
    },
    async start(controller) {
      const send = (event: ImportEvent) => {
        if (!abort.signal.aborted) controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'))
      }
      try {
        const preview = await importCv(source, (phase) => send({ type: 'phase', phase }), abort.signal)
        send({ type: 'done', preview })
      } catch (error) {
        if (abort.signal.aborted) return
        console.error('import failed', error)
        send({ type: 'error', message: describe(error) })
      } finally {
        try {
          controller.close()
        } catch {
          // Already closed by the client cancelling.
        }
      }
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' },
  })
}
