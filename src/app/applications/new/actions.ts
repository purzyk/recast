'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { STATUS_ORDER, type Status } from '@/lib/status'

export interface DuplicateMatch {
  id: number
  company: string
  role: string
  status: Status
  since: Date
}

/**
 * The duplicate guard's lookup.
 *
 * Case-insensitive on both fields, because "Vercel" and "vercel" typed three
 * weeks apart are the same company. Archived applications count — the whole
 * point is remembering what you already applied for, and an archived record
 * is exactly the one you have forgotten.
 */
export async function findDuplicate(company: string, role: string): Promise<DuplicateMatch | null> {
  const trimmedCompany = company.trim()
  const trimmedRole = role.trim()
  if (!trimmedCompany || !trimmedRole) return null

  const match = await db.application.findFirst({
    where: {
      role: { equals: trimmedRole, mode: 'insensitive' },
      company: { name: { equals: trimmedCompany, mode: 'insensitive' } },
    },
    include: {
      company: { select: { name: true } },
      history: { orderBy: { at: 'desc' }, take: 1, select: { at: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!match) return null

  return {
    id: match.id,
    company: match.company.name,
    role: match.role,
    status: match.status as Status,
    since: match.history[0]?.at ?? match.createdAt,
  }
}

export async function createApplication(formData: FormData) {
  const companyName = String(formData.get('company') ?? '').trim()
  const role = String(formData.get('role') ?? '').trim()
  const status = String(formData.get('status') ?? 'saved')
  const sourceUrl = String(formData.get('sourceUrl') ?? '').trim()
  const jobDescription = String(formData.get('jobDescription') ?? '').trim()
  const dateRaw = String(formData.get('date') ?? '').trim()

  if (!companyName || !role) {
    throw new Error('Company and role are required')
  }
  if (!STATUS_ORDER.includes(status as Status)) {
    throw new Error(`Unknown status: ${status}`)
  }

  // A date in the future is a typo, not an intention.
  const parsed = dateRaw ? new Date(dateRaw) : null
  const at = parsed && !Number.isNaN(parsed.getTime()) && parsed <= new Date() ? parsed : new Date()

  // Companies are matched by name, case-insensitively, so the same employer
  // typed two ways does not become two rows — which would defeat the
  // duplicate guard and split the companies view.
  const existing = await db.company.findFirst({
    where: { name: { equals: companyName, mode: 'insensitive' } },
    select: { id: true },
  })
  const companyId =
    existing?.id ?? (await db.company.create({ data: { name: companyName }, select: { id: true } })).id

  const created = await db.application.create({
    data: {
      companyId,
      role,
      status: status as Status,
      sourceUrl: sourceUrl || null,
      jobDescription: jobDescription || null,
      createdAt: at,
      history: { create: { status: status as Status, at } },
    },
    select: { id: true },
  })

  revalidatePath('/')
  redirect(`/applications/${created.id}`)
}
