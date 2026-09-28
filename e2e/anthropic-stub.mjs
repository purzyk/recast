// A stand-in for the Anthropic Messages API, so e2e runs cost nothing and
// always get the same answer. The app's SDK reaches it through
// ANTHROPIC_BASE_URL and streams it like the real thing; the answer is built
// from the entries in the request, so every id it cites exists.
//
// A posting containing [stub:refuse] gets a refusal, to exercise the error path.
import http from 'node:http'

const PORT = Number(process.env.STUB_PORT ?? 3101)

function parseEntries(content) {
  const pattern =
    /<entry id="(\d+)" kind="(\w+)"[^>]*?(?: parent="(\d+)")?[^>]*>\n<title>(.*)<\/title>\n([\s\S]*?)\n<\/entry>/g
  return [...content.matchAll(pattern)].map(([, id, kind, parent, title, body]) => ({
    id: Number(id),
    kind,
    parentId: parent ? Number(parent) : null,
    title,
    bullets: body
      .split('\n')
      .filter((line) => line.startsWith('- '))
      .map((line) => line.slice(2)),
    body,
  }))
}

function cv(entries, posting) {
  const skills = entries.filter((entry) => entry.kind === 'skill')
  const jobs = entries.filter((entry) => entry.kind === 'work')
  const phrases = ['React', 'TypeScript', 'Kubernetes'].filter((phrase) => posting.includes(phrase))
  return {
    requirements: phrases.map((phrase) => ({
      phrase,
      entryIds: skills.filter((skill) => skill.body.includes(phrase)).map((skill) => skill.id),
    })),
    headline: 'Frontend Engineer · React · TypeScript',
    summary: { text: 'Frontend engineer who ships **React** interfaces.', entryIds: jobs.map((job) => job.id) },
    skills: skills.map((skill) => ({ entryId: skill.id, items: skill.body })),
    experience: jobs.map((job) => ({
      entryId: job.id,
      sections: [
        ...entries
          .filter((entry) => entry.parentId === job.id)
          .map((project) => ({
            projectId: project.id,
            bullets: project.bullets.map((text) => ({ text, entryIds: [project.id] })),
          })),
        { projectId: 0, bullets: job.bullets.slice(0, 2).map((text) => ({ text, entryIds: [job.id] })) },
      ],
    })),
    projects: entries
      .filter((entry) => entry.kind === 'project' && !entry.parentId)
      .map((project) => ({ entryId: project.id, text: `Stub summary of ${project.title}.` })),
  }
}

function letter(entries) {
  const job = entries.find((entry) => entry.kind === 'work')
  return {
    requirements: [],
    paragraphs: [
      { label: 'Opening', text: 'Stub opening paragraph.', entryIds: [] },
      { label: 'Evidence', text: 'Stub evidence paragraph.', entryIds: job ? [job.id] : [] },
      { label: 'Close', text: 'Stub closing paragraph.', entryIds: [] },
    ],
  }
}

// The pasted CV's first line names the employer, so each import is distinct.
const imported = (cv) => ({
  profile: {
    name: 'Imported Person',
    headline: 'Frontend Developer',
    contact: ['Gdańsk'],
    links: [],
    portfolio: { text: '', label: '', url: '' },
    education: '',
    quotes: [],
  },
  entries: [
    {
      key: 'e1',
      kind: 'work',
      title: `Developer — ${cv.split('\n')[1]}`,
      period: '2019 – 2023',
      body: '- Imported bullet',
      links: '',
      parentKey: '',
    },
    { key: 'e2', kind: 'skill', title: 'Imported skills', period: '', body: 'Svelte, Vue', links: '', parentKey: '' },
  ],
})

function answer(request) {
  const content = request.messages[0].content
  const text = typeof content === 'string' ? content : content.map((part) => part.text ?? '').join('\n')
  if (text.includes('[stub:refuse]')) return { stopReason: 'refusal', output: {} }
  if (request.system.startsWith('You turn a CV')) return { stopReason: 'end_turn', output: imported(text) }
  const entries = parseEntries(text)
  const posting = text.slice(text.indexOf('<posting'))
  return {
    stopReason: 'end_turn',
    output: request.system.startsWith('You tailor a CV') ? cv(entries, posting) : letter(entries),
  }
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function stream(response, request) {
  const { stopReason, output } = answer(request)
  const json = JSON.stringify(output)
  const send = (type, data) => response.write(`event: ${type}\ndata: ${JSON.stringify({ type, ...data })}\n\n`)

  response.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' })
  send('message_start', {
    message: {
      id: 'msg_stub',
      type: 'message',
      role: 'assistant',
      model: request.model,
      content: [],
      stop_reason: null,
      stop_sequence: null,
      usage: { input_tokens: 1200, output_tokens: 0 },
    },
  })
  await wait(150)
  send('content_block_start', { index: 0, content_block: { type: 'thinking', thinking: '', signature: '' } })
  send('content_block_delta', { index: 0, delta: { type: 'signature_delta', signature: 'stub' } })
  send('content_block_stop', { index: 0 })
  await wait(150)
  send('content_block_start', { index: 1, content_block: { type: 'text', text: '' } })
  for (let at = 0; at < json.length; at += 400) {
    send('content_block_delta', { index: 1, delta: { type: 'text_delta', text: json.slice(at, at + 400) } })
  }
  send('content_block_stop', { index: 1 })
  send('message_delta', { delta: { stop_reason: stopReason, stop_sequence: null }, usage: { output_tokens: 345 } })
  send('message_stop', {})
  response.end()
}

http
  .createServer(async (request, response) => {
    if (request.method === 'GET') return response.end('ok')

    let raw = ''
    for await (const chunk of request) raw += chunk
    try {
      await stream(response, JSON.parse(raw))
    } catch (error) {
      console.error(error)
      response.writeHead(500).end()
    }
  })
  .listen(PORT, () => console.log(`anthropic stub on ${PORT}`))
