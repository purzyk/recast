'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { isExperienceKind } from '@/lib/experience'
import { ImportPreview } from '@/lib/import-cv'
import type { Profile } from '@/lib/profile'

interface ParsedEntry {
  title: string
  kind: ReturnType<typeof parseKind>
  period: string | null
  body: string
  links: string | null
  parentId: number | null
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

  const links = String(formData.get('links') ?? '').trim()
  const parent = Number(formData.get('parentId') || 0)

  return {
    title,
    kind: parseKind(formData.get('kind')),
    period: period || null,
    body,
    links: links || null,
    parentId: Number.isInteger(parent) && parent > 0 ? parent : null,
  }
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

/**
 * Saves an import preview. "replace" empties the library first; generated
 * documents keep their text, but their provenance lines lose the entries
 * that are gone. The profile is written only when asked, so importing a
 * second CV to pick up a few projects does not overwrite contact details.
 */
export async function saveImport(
  raw: unknown,
  mode: 'add' | 'replace',
  replaceProfile: boolean,
): Promise<{ entries: number }> {
  const preview = ImportPreview.parse(raw)
  if (mode !== 'add' && mode !== 'replace') throw new Error('Invalid mode')

  const profile: Profile = {
    name: preview.profile.name,
    headline: preview.profile.headline,
    contact: preview.profile.contact,
    links: preview.profile.links.filter((link) => /^https?:\/\//.test(link.url)),
    portfolio: /^https?:\/\//.test(preview.profile.portfolio.url) ? preview.profile.portfolio : undefined,
    education: preview.profile.education || undefined,
    quotes: preview.profile.quotes.map((quote) => ({
      entry: quote.entryTitle,
      text: quote.text,
      attribution: quote.attribution,
    })),
    signOff: 'Kind regards,',
  }

  await db.$transaction(async (tx) => {
    if (mode === 'replace') await tx.experienceEntry.deleteMany()

    if (replaceProfile) {
      await tx.profile.upsert({
        where: { id: 1 },
        create: { id: 1, content: JSON.stringify(profile) },
        update: { content: JSON.stringify(profile) },
      })
    }

    // Jobs first, so their projects can point at them.
    const ids = new Map<string, number>()
    const ordered = [...preview.entries].sort((a, b) => Number(Boolean(a.parentKey)) - Number(Boolean(b.parentKey)))
    for (const entry of ordered) {
      const created = await tx.experienceEntry.create({
        data: {
          kind: entry.kind,
          title: entry.title.trim(),
          period: entry.period.trim() || null,
          body: entry.body.trim(),
          links: entry.links.trim() || null,
          parentId: entry.parentKey ? (ids.get(entry.parentKey) ?? null) : null,
        },
        select: { id: true },
      })
      ids.set(entry.key, created.id)
    }
  })

  revalidatePath('/experience')
  return { entries: preview.entries.length }
}

export async function deleteEntry(formData: FormData) {
  const id = parseId(formData.get('id'))
  await db.experienceEntry.delete({ where: { id } })
  revalidatePath('/experience')
  redirect('/experience')
}
