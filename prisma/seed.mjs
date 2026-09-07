import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/index.js'

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })

const rows = [
  ['Allegro', 'Senior Frontend Developer', 'saved', 2, true],
  ['Brainly', 'React Developer', 'saved', 4, false],
  ['Netguru', 'Frontend Engineer', 'saved', 8, true],
  ['Sunscrapers', 'Senior React Developer', 'applied', 3, true],
  ['Vercel', 'Frontend Engineer', 'applied', 5, true],
  ['Docplanner', 'Senior Frontend Engineer', 'applied', 9, true],
  ['Nomagic', 'Senior Frontend Developer', 'interview', 1, true],
  ['Packhelp', 'Frontend Engineer', 'interview', 4, true],
  ['Booksy', 'Senior Frontend Engineer', 'rejected', 8, true],
  ['Tidio', 'React Engineer', 'rejected', 21, false],
]

for (const [name, role, status, daysAgo, hasUrl] of rows) {
  const company = await db.company.upsert({ where: { name }, update: {}, create: { name } })
  const at = new Date(Date.now() - daysAgo * 86400000)
  await db.application.create({
    data: {
      companyId: company.id,
      role,
      status,
      sourceUrl: hasUrl ? `https://example.com/jobs/${name.toLowerCase()}` : null,
      createdAt: at,
      history: { create: { status, at } },
    },
  })
}
console.log('seeded:', await db.application.count(), 'applications,', await db.company.count(), 'companies')
await db.$disconnect()
