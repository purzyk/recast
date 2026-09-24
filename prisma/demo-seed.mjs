// Fills a database with the demo data used for the portfolio recordings.
// The data itself lives in prisma/demo/ (gitignored: it holds third-party
// posting text). Refuses to touch a non-empty database unless --reset is
// passed, which deletes everything first.
//
//   DATABASE_URL=... node prisma/demo-seed.mjs [--reset]
import fs from 'node:fs'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/index.js'

const read = (name) => JSON.parse(fs.readFileSync(new URL(`./demo/${name}`, import.meta.url), 'utf8'))
const postings = read('postings.json')
const experience = read('experience.json')
const profile = read('profile.json')

// Per posting: the status path it took, as [status, days ago] steps, plus
// what a human would have written down. Posting 11 is left out on purpose:
// it is posting 3 again from another job board, added by hand on camera to
// show the duplicate guard.
const PLAN = {
  12: { history: [['saved', 2]] },
  10: { history: [['saved', 1]] },
  3: { history: [['saved', 4]] },
  1: { history: [['saved', 12], ['applied', 9]] },
  7: { history: [['saved', 8], ['applied', 6]] },
  2: { history: [['saved', 6], ['applied', 3]] },
  4: {
    history: [['saved', 18], ['applied', 16]],
    notes: [[16, 'Asks for five years of Node.js on the backend. Applied for the React side anyway.']],
  },
  6: {
    history: [['saved', 20], ['applied', 17], ['interview', 5]],
    contact: 5,
    notes: [
      [17, 'WordPress block themes and WooCommerce are the whole job. Led with Grid Architekci and Staropolanka.'],
      [5, 'Call with the digital manager. Technical task next: a Figma layout into a block theme.'],
    ],
  },
  8: {
    history: [['saved', 15], ['applied', 13], ['interview', 2]],
    contact: 2,
    notes: [[2, 'Recruiter screen done. Technical interview with the team lead next week.']],
  },
  5: {
    history: [['saved', 25], ['applied', 23], ['rejected', 14]],
    notes: [[14, 'Rejected: they wanted hands-on Oracle NetSuite experience.']],
  },
  9: {
    history: [['saved', 22], ['applied', 21], ['rejected', 10]],
    notes: [[10, 'Rejected: the role is mostly .NET on the backend.']],
  },
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
const daysAgo = (days) => new Date(Date.now() - days * 86_400_000 - Math.floor(Math.random() * 6) * 3_600_000)
const portal = (url) => `${new URL(url).origin}/`

const existing = (await db.application.count()) + (await db.experienceEntry.count())
if (existing > 0 && !process.argv.includes('--reset')) {
  console.error(`Database is not empty (${existing} rows). Pass --reset to delete everything and reseed.`)
  process.exit(1)
}

await db.$transaction([
  db.document.deleteMany(),
  db.note.deleteMany(),
  db.statusEvent.deleteMany(),
  db.application.deleteMany(),
  db.company.deleteMany(),
  db.experienceEntry.deleteMany(),
  db.profile.deleteMany(),
])

await db.profile.create({ data: { id: 1, content: JSON.stringify(profile) } })

// Parents are named by title in the data file and resolved once every entry
// has an id. Created in reverse so the library, which lists newest first,
// shows them in the file's order.
const ids = new Map()
for (const { parent, ...entry } of [...experience].reverse()) {
  const created = await db.experienceEntry.create({ data: entry })
  ids.set(entry.title, created.id)
}
for (const entry of experience.filter((item) => item.parent)) {
  const parentId = ids.get(entry.parent)
  if (!parentId) throw new Error(`Unknown parent "${entry.parent}" for "${entry.title}"`)
  await db.experienceEntry.update({ where: { id: ids.get(entry.title) }, data: { parentId } })
}

for (const posting of postings) {
  const plan = PLAN[posting.source]
  if (!plan) continue

  const company = await db.company.upsert({
    where: { name: posting.company },
    update: {},
    create: { name: posting.company },
  })
  const history = plan.history.map(([status, days]) => ({ status, at: daysAgo(days) }))
  const current = history.at(-1)

  await db.application.create({
    data: {
      companyId: company.id,
      role: posting.role,
      status: current.status,
      // The portal, not the posting: the real posting names the real employer.
      sourceUrl: portal(posting.url),
      jobDescription: posting.jobDescription,
      lastContactAt: plan.contact ? daysAgo(plan.contact) : null,
      createdAt: history[0].at,
      history: { create: history },
      notes: { create: (plan.notes ?? []).map(([days, body]) => ({ body, createdAt: daysAgo(days) })) },
    },
  })
}

console.log(
  'seeded:',
  await db.application.count(), 'applications,',
  await db.company.count(), 'companies,',
  await db.experienceEntry.count(), 'experience entries',
)
await db.$disconnect()
