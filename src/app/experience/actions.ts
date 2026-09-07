'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { isExperienceKind } from '@/lib/experience'

interface ParsedEntry {
  title: string
  kind: ReturnType<typeof parseKind>
  period: string | null
  body: string
}

function parseKind(raw: FormDataEntryValue | null) {
  const kind = String(raw ?? '')
  if (!isExperienceKind(kind)) throw new Error(`Unknown kind: ${kind}`)
  return kind
}

function parseEntry(formData: FormData): ParsedEntry {
  const title = String(formData.get('title') ?? '').trim()
  const body = String(formData.get('body') ?? '').trim()
  const period = String(formData.get('period') ?? '').trim()

  if (!title) throw new Error('Title is required')
  if (!body) throw new Error('Body is required')

  return { title, kind: parseKind(formData.get('kind')), period: period || null, body }
}

function parseId(raw: FormDataEntryValue | null): number {
  const id = Number(raw)
  if (!Number.isInteger(id) || id <= 0) throw new Error('Invalid entry id')
  return id
}

export async function createEntry(formData: FormData) {
  await db.experienceEntry.create({ data: parseEntry(formData) })
  revalidatePath('/experience')
  redirect('/experience')
}

export async function updateEntry(formData: FormData) {
  const id = parseId(formData.get('id'))
  await db.experienceEntry.update({ where: { id }, data: parseEntry(formData) })
  revalidatePath('/experience')
  revalidatePath(`/experience/${id}`)
  redirect('/experience')
}

export async function deleteEntry(formData: FormData) {
  const id = parseId(formData.get('id'))
  await db.experienceEntry.delete({ where: { id } })
  revalidatePath('/experience')
  redirect('/experience')
}
