import { describe, expect, it } from 'vitest'
import { chaseHint } from '@/lib/application-detail'
import { statusRank } from '@/lib/companies'

const now = new Date('2026-09-28T12:00:00Z')
const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000)

describe('chaseHint', () => {
  it.each(['saved', 'offer', 'rejected'] as const)('has nothing to chase in %s', (status) => {
    expect(chaseHint(status, daysAgo(30), now)).toBeNull()
  })

  it('announces a move made today', () => {
    expect(chaseHint('applied', daysAgo(0), now)).toBe('Moved to Applied today. Chase at 14 days.')
  })

  it('uses the singular for one day', () => {
    expect(chaseHint('interview', daysAgo(1), now)).toBe('1 day in Interview. Chase at 7.')
  })

  it('counts days until the threshold', () => {
    expect(chaseHint('applied', daysAgo(13), now)).toBe('13 days in Applied. Chase at 14.')
  })

  it('says to chase applied after two weeks', () => {
    expect(chaseHint('applied', daysAgo(14), now)).toBe('14 days in Applied. Worth chasing.')
  })

  it('says to chase an interview after one week', () => {
    expect(chaseHint('interview', daysAgo(7), now)).toBe('7 days in Interview. Worth chasing.')
  })
})

describe('statusRank', () => {
  it('follows the pipeline order', () => {
    const ranks = (['saved', 'applied', 'interview', 'offer', 'rejected'] as const).map(statusRank)
    expect(ranks).toEqual([0, 1, 2, 3, 4])
  })
})
