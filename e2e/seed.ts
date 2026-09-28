import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma'

// Fictional throughout: no real employer appears as applied-to or rejected.
export const SEED = {
  tailoring: { company: 'Northwind Labs', role: 'Frontend Developer' },
  interview: { company: 'Brightpath', role: 'React Engineer' },
  refusal: { company: 'Mirecourt', role: 'UI Engineer' },
}

const POSTING = `About us
Northwind Labs builds logistics dashboards.

Requirements:
- 3+ years of React
- Strong TypeScript
- Experience with Kubernetes

We offer
Remote work
Private healthcare`

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000)

export async function seed(connectionString: string) {
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
  try {
    const tables = await db.$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`
    if (tables.length) {
      const list = tables.map((table) => `"${table.tablename}"`).join(', ')
      await db.$executeRawUnsafe(`TRUNCATE ${list} RESTART IDENTITY CASCADE`)
    }

    const application = async (
      company: string,
      role: string,
      history: [status: 'saved' | 'applied' | 'interview', days: number][],
      jobDescription: string | null,
    ) => {
      await db.application.create({
        data: {
          company: { connectOrCreate: { where: { name: company }, create: { name: company } } },
          role,
          status: history.at(-1)![0],
          jobDescription,
          createdAt: daysAgo(history[0]![1]),
          history: { create: history.map(([status, days]) => ({ status, at: daysAgo(days) })) },
        },
      })
    }

    await application(
      SEED.tailoring.company,
      SEED.tailoring.role,
      [
        ['saved', 5],
        ['applied', 3],
      ],
      POSTING,
    )
    await application(
      SEED.interview.company,
      SEED.interview.role,
      [
        ['saved', 20],
        ['applied', 18],
        ['interview', 9],
      ],
      'React and testing.',
    )
    await application(
      SEED.refusal.company,
      SEED.refusal.role,
      [['saved', 2]],
      'A posting the stub refuses. [stub:refuse]',
    )

    const harbour = await db.experienceEntry.create({
      data: {
        kind: 'work',
        title: 'Frontend Engineer — Harbour Digital',
        period: '2021 – present',
        body: 'Product team of six.\n- Rebuilt the booking flow in React and TypeScript\n- Added Playwright tests to every release\n- Cut bundle size by a third',
        links: 'https://harbour.example',
      },
    })
    await db.experienceEntry.createMany({
      data: [
        { kind: 'project', title: 'Harbour Portal', body: '- Built the customer portal', parentId: harbour.id },
        {
          kind: 'work',
          title: 'Web Developer — Ferncliff Studio',
          period: '2017 – 2021',
          body: '- Built marketing sites\n- Ran accessibility audits',
        },
        {
          kind: 'project',
          title: 'Tide Tracker',
          period: '2024',
          body: 'A tide table app.',
          links: 'Repo https://github.com/example/tides',
        },
        { kind: 'skill', title: 'Frontend', body: 'React, TypeScript, Next.js' },
        { kind: 'skill', title: 'Testing', body: 'Playwright, Vitest' },
      ],
    })

    await db.profile.create({
      data: {
        id: 1,
        content: JSON.stringify({
          name: 'Alex Tester',
          headline: 'Frontend Engineer',
          contact: ['Kraków', 'alex@example.com'],
          links: [{ label: 'GitHub', url: 'https://github.com/example' }],
          quotes: [],
        }),
      },
    })
  } finally {
    await db.$disconnect()
  }
}
