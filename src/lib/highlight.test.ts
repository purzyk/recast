import { describe, expect, it } from 'vitest'
import { highlight } from '@/lib/highlight'

const matched = (text: string, phrases: string[]) =>
  highlight(text, phrases)
    .filter((segment) => segment.matched)
    .map((segment) => segment.text)

describe('highlight', () => {
  it('returns the whole text unmatched when there are no phrases', () => {
    expect(highlight('React and TypeScript', [])).toEqual([{ text: 'React and TypeScript', matched: false }])
  })

  it('splits around a match and keeps the original casing', () => {
    expect(highlight('Strong React skills', ['react'])).toEqual([
      { text: 'Strong ', matched: false },
      { text: 'React', matched: true },
      { text: ' skills', matched: false },
    ])
  })

  it('underlines only the first occurrence of a phrase', () => {
    expect(matched('React here, React there', ['React'])).toEqual(['React'])
  })

  it('orders matches by position, not by phrase order', () => {
    expect(matched('Next.js with TypeScript', ['TypeScript', 'Next.js'])).toEqual(['Next.js', 'TypeScript'])
  })

  it('resolves overlaps to the phrase that starts first', () => {
    expect(matched('React Native apps', ['Native apps', 'React Native'])).toEqual(['React Native'])
  })

  it('prefers the longer phrase when two start at the same place', () => {
    expect(matched('React Native apps', ['React', 'React Native'])).toEqual(['React Native'])
  })

  it('ignores blank and paraphrased phrases', () => {
    expect(matched('Build accessible UIs', ['  ', 'a11y'])).toEqual([])
  })

  it('trims phrases before matching', () => {
    expect(matched('Build accessible UIs', ['  accessible '])).toEqual(['accessible'])
  })

  it('reassembles to the original text', () => {
    const text = 'We need TypeScript, React and testing experience.'
    const joined = highlight(text, ['react', 'testing', 'missing']).map((segment) => segment.text).join('')
    expect(joined).toBe(text)
  })
})
