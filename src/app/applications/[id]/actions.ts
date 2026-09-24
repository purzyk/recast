'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { STATUS_ORDER, type Status } from '@/lib/status'
import { parseContent } from '@/lib/documents'

function parseId(raw: FormDataEntryValue | null): number {
  const id = Number(raw)
  if (!Number.isInteger(id) || id <= 0) throw new Error('Invalid application id')
  return id
}

/**
 * Status changes append to history rather than only updating the column.
 * The card's "time in column" and the detail timeline both read that history,
 * so a change that skipped it would silently reset neither and break both.
 */
export async function moveApplication(formData: FormData) {
  const id = parseId(formData.get('id'))
  const status = String(formData.get('status'))

  if (!STATUS_ORDER.includes(status as Status)) {
    throw new Error(`Unknown status: ${status}`)
  }

  const current = await db.application.findUnique({ where: { id }, select: { status: true } })
  if (!current) throw new Error('Application not found')

  // Re-selecting the current status should not litter the timeline.
  if (current.status === status) return

  await db.$transaction([
    db.application.update({
      where: { id },
      data: { status: status as Status },
    }),
    db.statusEvent.create({
      data: { applicationId: id, status: status as Status },
    }),
  ])

  revalidatePath('/')
  revalidatePath(`/applications/${id}`)
}

export async function addNote(formData: FormData) {
  const id = parseId(formData.get('id'))
  const body = String(formData.get('body') ?? '').trim()

  if (!body) return

  await db.note.create({ data: { applicationId: id, body } })
  revalidatePath(`/applications/${id}`)
}

/** Tailoring reads the posting, so an application saved without one can
 *  have it pasted in from the tailoring screen. */
export async function saveJobDescription(formData: FormData) {
  const id = parseId(formData.get('id'))
  const jobDescription = String(formData.get('jobDescription') ?? '').trim()
  if (!jobDescription) return

  await db.application.update({ where: { id }, data: { jobDescription } })
  revalidatePath(`/applications/${id}`)
  revalidatePath(`/applications/${id}/tailor`)
}

/**
 * Edits land on the version being read, not a new one: a version is what the
 * model wrote plus what you changed before sending. The block and the
 * document are both marked edited, so the history shows which versions were
 * sent as generated.
 */
export async function updateBlock(documentId: number, blockId: string, text: string) {
  if (!Number.isInteger(documentId) || typeof blockId !== 'string' || typeof text !== 'string') {
    throw new Error('Invalid block update')
  }
  const document = await db.document.findUnique({
    where: { id: documentId },
    select: { applicationId: true, content: true },
  })
  if (!document) throw new Error('Document not found')

  const content = parseContent(document.content)
  const block = content.blocks.find((candidate) => candidate.id === blockId)
  if (!block) throw new Error('Block not found')

  const trimmed = text.trim()
  if (trimmed === block.text) return

  block.text = trimmed
  block.edited = true

  await db.document.update({
    where: { id: documentId },
    data: { content: JSON.stringify(content), edited: true },
  })
  revalidatePath(`/applications/${document.applicationId}`)
  revalidatePath(`/applications/${document.applicationId}/documents/${documentId}`)
}

/** Versions are kept by default; deleting one is for drafts not worth keeping. */
export async function deleteDocument(formData: FormData) {
  const documentId = parseId(formData.get('documentId'))
  const document = await db.document.delete({ where: { id: documentId }, select: { applicationId: true } })
  revalidatePath(`/applications/${document.applicationId}`)
  revalidatePath('/experience')
  redirect(`/applications/${document.applicationId}`)
}

/**
 * Archiving, not deleting, is the default elsewhere — but an explicit delete
 * has to actually delete. History and notes cascade.
 */
export async function deleteApplication(formData: FormData) {
  const id = parseId(formData.get('id'))
  await db.application.delete({ where: { id } })
  revalidatePath('/')
  redirect('/')
}
