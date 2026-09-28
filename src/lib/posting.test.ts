import { describe, expect, it } from 'vitest'
import { parsePosting } from '@/lib/posting'

describe('parsePosting', () => {
  it('returns nothing for blank text', () => {
    expect(parsePosting('\n  \r\n')).toEqual([])
  })

  it('treats text without sections as paragraphs', () => {
    expect(parsePosting('We build tools.\nJoin us.')).toEqual([
      { kind: 'paragraph', text: 'We build tools.' },
      { kind: 'paragraph', text: 'Join us.' },
    ])
  })

  it('groups dashed bullets under a heading, across blank lines and CRLF', () => {
    const text = 'Requirements:\r\n- 3 years of React\r\n\r\n• Good English\r\n\r\n* Testing experience'
    expect(parsePosting(text)).toEqual([
      { kind: 'heading', text: 'Requirements' },
      { kind: 'list', items: ['3 years of React', 'Good English', 'Testing experience'] },
    ])
  })

  it('turns undashed short lines under a section into a list', () => {
    expect(parsePosting('Obowiązki\nTworzenie interfejsów w React\nPisanie testów')).toEqual([
      { kind: 'heading', text: 'Obowiązki' },
      { kind: 'list', items: ['Tworzenie interfejsów w React', 'Pisanie testów'] },
    ])
  })

  it('keeps lines under an introductory section as prose', () => {
    expect(parsePosting('About us\nWe are a small studio.\nWe ship often.')).toEqual([
      { kind: 'heading', text: 'About us' },
      { kind: 'paragraph', text: 'We are a small studio.' },
      { kind: 'paragraph', text: 'We ship often.' },
    ])
  })

  it('does not mistake a short capitalised bullet for a heading', () => {
    const blocks = parsePosting('Benefits\nElastyczne godziny pracy\nPrywatna opieka medyczna')
    expect(blocks).toEqual([
      { kind: 'heading', text: 'Benefits' },
      { kind: 'list', items: ['Elastyczne godziny pracy', 'Prywatna opieka medyczna'] },
    ])
  })

  it('turns a labelled stack of technology names into tags', () => {
    const text = 'Technologies\nRequired:\nReact\nTypeScript\nNice to have:\nGraphQL'
    expect(parsePosting(text)).toEqual([
      { kind: 'heading', text: 'Technologies' },
      { kind: 'tags', label: 'Required', items: ['React', 'TypeScript'] },
      { kind: 'tags', label: 'Nice to have', items: ['GraphQL'] },
    ])
  })

  it('pairs JustJoin tech stack names with their levels', () => {
    const text = 'Tech stack\nReact\nadvanced\nTypeScript\nregular\nAbout the role\nYou will build UIs.'
    expect(parsePosting(text)).toEqual([
      { kind: 'heading', text: 'Tech stack' },
      { kind: 'tags', items: ['React · advanced', 'TypeScript · regular'] },
      { kind: 'heading', text: 'About the role' },
      { kind: 'paragraph', text: 'You will build UIs.' },
    ])
  })

  it('turns a long dashed technology list into deduplicated tags', () => {
    const text = 'Tech stack we use:\n- React\n- Next.js\n- TypeScript\n- React\n- Vitest'
    expect(parsePosting(text)).toEqual([
      { kind: 'heading', text: 'Tech stack we use' },
      { kind: 'tags', items: ['React', 'Next.js', 'TypeScript', 'Vitest'] },
    ])
  })

  it('never adds or rewords text', () => {
    const text = 'Requirements:\n- React\n- Clear written English, since the team is remote\nWe offer\nRemote work'
    const words = parsePosting(text).flatMap((block) =>
      block.kind === 'heading' || block.kind === 'paragraph' ? [block.text] : block.items,
    )
    for (const word of words) expect(text).toContain(word)
  })
})
