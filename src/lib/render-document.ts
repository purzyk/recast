import { CV_STYLES } from '@/lib/cv-styles'
import { parseLinks, splitBody, type ExperienceEntryRow } from '@/lib/experience'
import type { DocumentBlock, DocumentContent, DocumentKind } from '@/lib/document-types'
import type { Profile } from '@/lib/profile'

/**
 * A tailored document as a standalone, printable HTML page in the master CV's
 * layout. Printing it from the browser ("Save as PDF") is the PDF export: the
 * hand-made CVs are produced the same way, so the two cannot drift apart, and
 * the container needs no headless browser of its own.
 */

const escape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Escapes, then turns **bold** into <strong>. Nothing else is interpreted. */
const inline = (value: string) => escape(value).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

const lines = (text: string) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

const link = (url: string, label: string) => `<a href="${escape(url)}">${escape(label)}</a>`

const SCREEN = `
  @media screen {
    html { background: #e6eaee; }
    body { max-width: 210mm; margin: 24px auto 48px; padding: 13mm 14mm; background: #fff;
           box-shadow: 0 1px 3px rgba(0,0,0,.12); }
    .toolbar { position: fixed; top: 12px; right: 12px; display: flex; gap: 8px; font: 13px system-ui, sans-serif; }
    .toolbar button, .toolbar a { padding: 6px 12px; border-radius: 4px; border: 1px solid #1a4f8a;
           background: #1a4f8a; color: #fff; cursor: pointer; font: inherit; text-decoration: none; }
    .toolbar a { background: #fff; color: #1a4f8a; }
  }
  @media print { .toolbar { display: none; } }
  .letter p { margin: 0 0 9px; text-align: left; }
  .letter .date { margin: 14px 0 12px; color: #5a6b7a; }
  .letter .subject { font-weight: 700; color: #12395f; margin-bottom: 12px; }
`

function page(title: string, body: string, backHref: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escape(title)}</title>
<style>${CV_STYLES}${SCREEN}</style>
</head>
<body>
<div class="toolbar"><a href="${escape(backHref)}">Back</a><button type="button" onclick="window.print()">Save as PDF</button></div>
${body}
<script>if (new URLSearchParams(location.search).has('print')) addEventListener('load', () => print())</script>
</body>
</html>`
}

function header(profile: Profile, headline: string): string {
  const contact = profile.contact.map(escape).join(' <span class="sep">|</span> ')
  const links = profile.links.map((item) => link(item.url, item.label)).join(' <span class="sep">|</span> ')
  const portfolio = profile.portfolio
    ? `<div class="portfolio">${escape(profile.portfolio.text)} ${link(profile.portfolio.url, profile.portfolio.label)}</div>`
    : ''
  return `<header>
  <h1>${escape(profile.name.toUpperCase())}</h1>
  ${headline ? `<div class="role">${inline(headline)}</div>` : ''}
  <div class="contact">${contact}${contact && links ? '<br>' : ''}${links}</div>
  ${portfolio}
</header>`
}

function list(text: string): string {
  return `<ul>${lines(text)
    .map((line) => `<li>${inline(line)}</li>`)
    .join('')}</ul>`
}

function renderCv(blocks: DocumentBlock[], profile: Profile, entries: Map<number, ExperienceEntryRow>): string {
  const find = (type: string) => blocks.find((block) => block.slot?.type === type)
  const out: string[] = [header(profile, find('headline')?.text ?? profile.headline)]

  const summary = find('summary')
  if (summary) out.push(`<h2>Summary</h2><p class="summary">${inline(summary.text)}</p>`)

  const skills = find('skills')
  if (skills) {
    const rows = lines(skills.text).map((line) => {
      const at = line.indexOf(':')
      const label = at < 0 ? '' : line.slice(0, at)
      const items = at < 0 ? line : line.slice(at + 1).trim()
      return `<tr><td class="k">${inline(label)}</td><td>${inline(items)}</td></tr>`
    })
    out.push(`<h2>Key Skills</h2><table class="skills">${rows.join('')}</table>`)
  }

  // Job blocks arrive grouped per job; the order they arrive in is the order
  // the CV lists them.
  const jobIds: number[] = []
  for (const block of blocks) {
    if (block.slot?.type === 'job' && !jobIds.includes(block.slot.entryId)) jobIds.push(block.slot.entryId)
  }
  if (jobIds.length) out.push('<h2>Experience</h2>')

  for (const jobId of jobIds) {
    const job = entries.get(jobId)
    if (!job) continue
    const sections = blocks.filter((block) => block.slot?.type === 'job' && block.slot.entryId === jobId)
    const hasProjects = sections.some((block) => block.slot?.type === 'job' && block.slot.projectId)

    const dash = job.title.lastIndexOf(' — ')
    const role = dash < 0 ? job.title : job.title.slice(0, dash)
    const org = dash < 0 ? '' : job.title.slice(dash + 3)
    const orgLink = parseLinks(job.links)[0]
    const orgHtml = org ? ` <span class="co">&mdash; ${orgLink ? link(orgLink.url, org) : escape(org)}</span>` : ''
    const intro = splitBody(job.body).intro

    const parts = [
      `<div class="job-head"><span class="job-title">${escape(role)}${orgHtml}</span>` +
        `<span class="job-meta">${escape(job.period ?? '')}</span></div>`,
    ]
    if (intro) parts.push(`<p class="job-intro">${inline(intro)}</p>`)

    for (const section of sections) {
      const projectId = section.slot?.type === 'job' ? section.slot.projectId : null
      const project = projectId ? entries.get(projectId) : undefined
      if (project) {
        const links = parseLinks(project.links)
          .map((item) => link(item.url, item.label))
          .join(' &middot; ')
        parts.push(
          `<div class="subhead">${escape(project.title)}${links ? ` <span class="live">&mdash; ${links}</span>` : ''}</div>`,
        )
      } else if (hasProjects) {
        parts.push('<div class="subhead">Engineering practice</div>')
      }
      parts.push(list(section.text))
    }

    for (const quote of profile.quotes.filter((item) => item.entry === job.title)) {
      parts.push(
        `<blockquote>&ldquo;${escape(quote.text)}&rdquo;<span class="attr">&mdash; ${escape(quote.attribution)}</span></blockquote>`,
      )
    }
    out.push(`<div class="job${hasProjects ? ' job-long' : ''}">${parts.join('\n')}</div>`)
  }

  const projects = blocks.filter((block) => block.slot?.type === 'project')
  if (projects.length) {
    const rows = projects.map((block) => {
      const entry = block.slot?.type === 'project' ? entries.get(block.slot.entryId) : undefined
      const name = entry ? escape(entry.title) : inline(block.label)
      const period = entry?.period ? ` <span style="font-weight:400;color:#5a6b7a">(${escape(entry.period)})</span>` : ''
      const links = parseLinks(entry?.links ?? null)
        .map((item) => link(item.url, item.label))
        .join('')
      return `<tr><td class="n">${name}${period}</td><td>${inline(block.text)}</td><td class="l">${links}</td></tr>`
    })
    out.push(`<div class="nobreak"><h2>Selected Projects</h2><table class="proj">${rows.join('')}</table></div>`)
  }

  // Blocks from before the template existed have no slot; they still render.
  for (const block of blocks.filter((item) => !item.slot)) {
    out.push(`<h2>${escape(block.label)}</h2>${block.format === 'list' ? list(block.text) : `<p>${inline(block.text)}</p>`}`)
  }

  if (profile.education) out.push(`<h2>Education</h2><p class="edu">${inline(profile.education)}</p>`)
  return out.join('\n')
}

function renderLetter(
  blocks: DocumentBlock[],
  profile: Profile,
  company: string,
  role: string,
  date: Date,
): string {
  const when = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
  const paragraphs = blocks.map((block) => `<p>${inline(block.text)}</p>`).join('\n')
  return `${header(profile, profile.headline)}
<div class="letter">
  <p class="date">${escape(when)}</p>
  <p class="subject">Application for ${escape(role)} at ${escape(company)}</p>
  <p>Dear ${escape(company)} team,</p>
  ${paragraphs}
  <p>${escape(profile.signOff ?? 'Kind regards,')}<br>${escape(profile.name)}</p>
</div>`
}

export function renderDocument(input: {
  kind: DocumentKind
  content: DocumentContent
  profile: Profile
  entries: ExperienceEntryRow[]
  company: string
  role: string
  createdAt: Date
  backHref: string
}): string {
  const slug = (value: string) => value.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '')
  const kindLabel = input.kind === 'cv' ? 'CV' : 'Cover-Letter'
  const title = `${slug(input.profile.name)}-${kindLabel}-${slug(input.company)}`

  const body =
    input.kind === 'cv'
      ? renderCv(input.content.blocks, input.profile, new Map(input.entries.map((entry) => [entry.id, entry])))
      : renderLetter(input.content.blocks, input.profile, input.company, input.role, input.createdAt)

  return page(title, body, input.backHref)
}
