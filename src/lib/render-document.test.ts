import { describe, expect, it } from 'vitest'
import type { DocumentBlock } from '@/lib/document-types'
import type { ExperienceEntryRow } from '@/lib/experience'
import type { Profile } from '@/lib/profile'
import { renderDocument } from '@/lib/render-document'

const profile: Profile = {
  name: 'Jane Doe',
  headline: 'Default headline',
  contact: ['Kraków', 'jane@example.com'],
  links: [{ label: 'GitHub', url: 'https://github.com/jane' }],
  portfolio: { text: 'Work:', label: 'jane.dev', url: 'https://jane.dev/?ref=cv' },
  education: '**University**, BSc',
  quotes: [{ entry: 'Engineer — Acme', text: 'Reliable.', attribution: 'A. Lead' }],
}

const entries: ExperienceEntryRow[] = [
  {
    id: 1,
    kind: 'work',
    title: 'Engineer — Acme',
    period: '2020 – 2024',
    body: 'Product team.\n- Bullet',
    links: 'https://acme.example',
    parentId: null,
    updatedAt: new Date(0),
  },
  {
    id: 2,
    kind: 'project',
    title: 'Dashboard',
    period: null,
    body: '',
    links: 'Live https://dash.example',
    parentId: 1,
    updatedAt: new Date(0),
  },
  {
    id: 3,
    kind: 'project',
    title: 'Tool',
    period: '2025',
    body: '',
    links: null,
    parentId: null,
    updatedAt: new Date(0),
  },
]

const block = (id: string, overrides: Partial<DocumentBlock>): DocumentBlock => ({
  id,
  label: id,
  format: 'paragraph',
  text: '',
  sources: [],
  edited: false,
  ...overrides,
})

const render = (kind: 'cv' | 'coverLetter', blocks: DocumentBlock[]) =>
  renderDocument({
    kind,
    content: { blocks, requirements: [] },
    profile,
    entries,
    company: 'Acme & Co',
    role: 'Senior <Engineer>',
    createdAt: new Date('2026-09-28T12:00:00Z'),
    backHref: '/applications/1',
  })

describe('renderDocument', () => {
  const cv = render('cv', [
    block('b1', { format: 'line', text: 'Frontend · **React**', slot: { type: 'headline' } }),
    block('b2', { text: 'Builds <script>alert(1)</script> **fast** UIs.', slot: { type: 'summary' } }),
    block('b3', { format: 'skills', text: 'Core: React, TS\nNo label here', slot: { type: 'skills' } }),
    block('b4', { format: 'list', text: 'Built it', slot: { type: 'job', entryId: 1, projectId: 2 } }),
    block('b5', { format: 'list', text: 'Own bullet', slot: { type: 'job', entryId: 1, projectId: null } }),
    block('b6', { text: 'A tool.', slot: { type: 'project', entryId: 3 } }),
    block('b7', { label: 'Legacy', text: 'Old block' }),
  ])

  it('names the page for the saved PDF', () => {
    expect(cv).toContain('<title>Jane-Doe-CV-Acme-Co</title>')
  })

  it('escapes model text and only interprets bold', () => {
    expect(cv).toContain('Builds &lt;script&gt;alert(1)&lt;/script&gt; <strong>fast</strong> UIs.')
    expect(cv).not.toContain('<script>alert(1)')
  })

  it('uses the generated headline over the profile one', () => {
    expect(cv).toContain('<div class="role">Frontend · <strong>React</strong></div>')
    expect(cv).not.toContain('Default headline')
  })

  it('renders skill rows, with or without a label', () => {
    expect(cv).toContain('<tr><td class="k">Core</td><td>React, TS</td></tr>')
    expect(cv).toContain('<tr><td class="k"></td><td>No label here</td></tr>')
  })

  it('prints fixed job details from the entry, not the model', () => {
    expect(cv).toContain('Engineer <span class="co">&mdash; <a href="https://acme.example">Acme</a></span>')
    expect(cv).toContain('<span class="job-meta">2020 – 2024</span>')
    expect(cv).toContain('<p class="job-intro">Product team.</p>')
    expect(cv).toContain('<div class="job job-long">')
  })

  it('heads project sections and labels the job’s own bullets when projects exist', () => {
    expect(cv).toContain('Dashboard <span class="live">&mdash; <a href="https://dash.example">Live</a></span>')
    expect(cv).toContain('<div class="subhead">Engineering practice</div>')
  })

  it('attaches quotes to their job', () => {
    expect(cv).toContain('&ldquo;Reliable.&rdquo;<span class="attr">&mdash; A. Lead</span>')
  })

  it('renders standalone projects, legacy blocks and education', () => {
    expect(cv).toContain('Tool <span style="font-weight:400;color:#5a6b7a">(2025)</span>')
    expect(cv).toContain('<h2>Legacy</h2><p>Old block</p>')
    expect(cv).toContain('<p class="edu"><strong>University</strong>, BSc</p>')
  })

  it('writes a cover letter with date, subject and sign-off', () => {
    const letter = render('coverLetter', [block('b1', { text: 'First.', slot: { type: 'letter' } })])

    expect(letter).toContain('<title>Jane-Doe-Cover-Letter-Acme-Co</title>')
    expect(letter).toContain('<p class="date">28 September 2026</p>')
    expect(letter).toContain('Application for Senior &lt;Engineer&gt; at Acme &amp; Co')
    expect(letter).toContain('<p>First.</p>')
    expect(letter).toContain('<p>Kind regards,<br>Jane Doe</p>')
  })
})
