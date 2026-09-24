import Anthropic from '@anthropic-ai/sdk'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getEntries } from '@/lib/experience'
import { createDocumentVersion, isDocumentKind } from '@/lib/documents'
import { tailor, TailorError, type TailorPhase } from '@/lib/tailor'

export const dynamic = 'force-dynamic'
// The call runs for tens of seconds; Cloud Run's request timeout is the real
// ceiling, this only stops Next from cutting it shorter.
export const maxDuration = 300

export type TailorEvent =
  | { type: 'phase'; phase: TailorPhase | 'saving' }
  | { type: 'done'; documentId: number; version: number }
  | { type: 'error'; message: string }

function describe(error: unknown): string {
  if (error instanceof TailorError) return error.message
  if (error instanceof Anthropic.AuthenticationError) return 'The Anthropic API key is missing or invalid.'
  if (error instanceof Anthropic.RateLimitError) return 'Rate limited by the Anthropic API. Try again in a minute.'
  if (error instanceof Anthropic.APIError) return `Anthropic API error ${error.status ?? ''}: ${error.message}`.trim()
  return 'Tailoring failed unexpectedly. Nothing was saved.'
}

/**
 * Newline-delimited JSON rather than one response at the end, so the panel
 * can narrate what is actually happening during a call that takes a while.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // The proxy already guards this path; checked again because this is the
  // one route that spends money.
  const session = await auth()
  if (!session?.user) return new Response('Unauthorized', { status: 401 })

  const id = Number((await params).id)
  const body = (await request.json().catch(() => ({}))) as { kind?: string }
  const kind = body.kind ?? ''
  if (!Number.isInteger(id) || id <= 0 || !isDocumentKind(kind)) {
    return new Response('Bad request', { status: 400 })
  }

  const application = await db.application.findUnique({
    where: { id },
    select: { role: true, jobDescription: true, company: { select: { name: true } } },
  })
  if (!application) return new Response('Not found', { status: 404 })

  // Cancel in the browser aborts the fetch; either signal below reaches the
  // API call, which stops generating. Nothing is saved after an abort.
  const abort = new AbortController()
  request.signal.addEventListener('abort', () => abort.abort())

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    cancel() {
      abort.abort()
    },
    async start(controller) {
      const send = (event: TailorEvent) => {
        if (!abort.signal.aborted) controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'))
      }

      try {
        const jobDescription = application.jobDescription?.trim()
        if (!jobDescription) throw new TailorError('Add a job description first. Tailoring reads it.')

        const entries = await getEntries()
        if (entries.length === 0) throw new TailorError('The experience library is empty, so there is nothing to draw from.')

        const result = await tailor(
          { kind, company: application.company.name, role: application.role, jobDescription, entries },
          (phase) => send({ type: 'phase', phase }),
          abort.signal,
        )
        if (abort.signal.aborted) return

        send({ type: 'phase', phase: 'saving' })
        const created = await createDocumentVersion({ applicationId: id, kind, ...result })

        revalidatePath(`/applications/${id}`)
        revalidatePath('/experience')
        send({ type: 'done', documentId: created.id, version: created.version })
      } catch (error) {
        if (abort.signal.aborted) return
        console.error('tailoring failed', error)
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
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store',
      // Stops any buffering proxy from holding the progress lines back.
      'X-Accel-Buffering': 'no',
    },
  })
}
