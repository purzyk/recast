import { db } from '@/lib/db'

export interface ProfileLink {
  label: string
  url: string
}

export interface ProfileQuote {
  /** Title of the work entry the quote renders under. */
  entry: string
  text: string
  attribution: string
}

/** Everything on a CV that does not change per posting. Text fields may use
 *  **bold**, as generated text does. */
export interface Profile {
  name: string
  headline: string
  contact: string[]
  links: ProfileLink[]
  portfolio?: { text: string; label: string; url: string }
  education?: string
  quotes: ProfileQuote[]
  signOff?: string
}

const EMPTY: Profile = { name: 'Your name', headline: '', contact: [], links: [], quotes: [] }

export async function getProfile(): Promise<Profile> {
  const row = await db.profile.findUnique({ where: { id: 1 } })
  if (!row) return EMPTY
  return { ...EMPTY, ...(JSON.parse(row.content) as Partial<Profile>) }
}
