import { describe, expect, it } from 'vitest'
import { elapsed } from '@/lib/elapsed'

const now = new Date('2026-09-28T12:00:00Z')
const ago = (seconds: number) => new Date(now.getTime() - seconds * 1000)
const DAY = 86_400

describe('elapsed', () => {
  it.each([
    [0, 'just now'],
    [3_599, 'just now'],
    [3_600, 'today'],
    [DAY - 1, 'today'],
    [DAY, 'yesterday'],
    [2 * DAY, '2d'],
    [6 * DAY, '6d'],
    [7 * DAY, '1w'],
    [29 * DAY, '4w'],
    [30 * DAY, '1mo'],
    [364 * DAY, '12mo'],
    [365 * DAY, '1y'],
    [800 * DAY, '2y'],
  ])('%is ago reads %s', (seconds, expected) => {
    expect(elapsed(ago(seconds), now)).toBe(expected)
  })

  it('treats a future date as just now', () => {
    expect(elapsed(new Date(now.getTime() + 60_000), now)).toBe('just now')
  })
})
