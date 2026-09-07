'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { STATUS_ORDER, type Status } from '@/lib/status'

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
