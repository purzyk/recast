import { auth } from '@/auth'
import { getDocument } from '@/lib/documents'
import { getEntries } from '@/lib/experience'
import { getProfile } from '@/lib/profile'
import { renderDocument } from '@/lib/render-document'

export const dynamic = 'force-dynamic'

/**
 * The document as a printable page, outside the app's own layout and theme:
 * it has to look like the paper CV, not like Recast. ?print opens the print
 * dialog on load, which is what the "Download PDF" button links to.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; documentId: string }> },
) {
  const session = await auth()
  if (!session?.user) return new Response('Unauthorized', { status: 401 })

  const { id, documentId } = await params
  const document = await getDocument(Number(documentId))
  if (!document || document.applicationId !== Number(id)) return new Response('Not found', { status: 404 })

  const [profile, entries] = await Promise.all([getProfile(), getEntries()])
  const html = renderDocument({
    kind: document.kind,
    content: document.content,
    profile,
    entries,
    company: document.company,
    role: document.role,
    createdAt: document.createdAt,
    backHref: `/applications/${id}/documents/${documentId}`,
  })

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } })
}
