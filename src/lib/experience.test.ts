import { describe, expect, it } from 'vitest'
import { isExperienceKind, parseLinks, periodEnd, splitBody } from '@/lib/experience'

describe('parseLinks', () => {
  it('returns nothing for empty input', () => {
    expect(parseLinks(null)).toEqual([])
    expect(parseLinks('')).toEqual([])
  })

  it('takes the last token as the URL so labels may contain spaces', () => {
    expect(parseLinks('Case study https://purzycki.pl/work/recast')).toEqual([
      { label: 'Case study', url: 'https://purzycki.pl/work/recast' },
    ])
  })

  it('labels a bare URL with its hostname', () => {
    expect(parseLinks('https://github.com/purzycki/recast')).toEqual([
      { label: 'github.com', url: 'https://github.com/purzycki/recast' },
    ])
  })

  it('skips blank lines and lines without an http(s) URL', () => {
    const raw = 'Demo https://example.com\n\n  \nRepo github.com/x\nFTP ftp://example.com'
    expect(parseLinks(raw)).toEqual([{ label: 'Demo', url: 'https://example.com' }])
  })
})

describe('splitBody', () => {
  it('separates intro prose from dashed bullets', () => {
    const body = 'Led the frontend.\nSmall team.\n- Built the board\n-  Wrote tests \n\n- Shipped it'
    expect(splitBody(body)).toEqual({
      intro: 'Led the frontend. Small team.',
      bullets: ['Built the board', 'Wrote tests', 'Shipped it'],
    })
  })

  it('does not treat a hyphen without a space as a bullet', () => {
    expect(splitBody('-not a bullet').bullets).toEqual([])
  })

  it('handles an empty body', () => {
    expect(splitBody('')).toEqual({ intro: '', bullets: [] })
  })
})

describe('periodEnd', () => {
  it.each([
    [null, 0],
    ['', 0],
    ['no year here', 0],
    ['2019', 2019],
    ['2018 – 2021', 2021],
    ['2022–2026 · Remote', 2026],
    ['2024 – present', 9999],
    ['Ongoing', 9999],
  ])('%s ends at %i', (period, expected) => {
    expect(periodEnd(period)).toBe(expected)
  })
})

describe('isExperienceKind', () => {
  it('accepts known kinds only', () => {
    expect(isExperienceKind('work')).toBe(true)
    expect(isExperienceKind('hobby')).toBe(false)
  })
})
