/**
 * "2d", "1w", "yesterday" — how long a card has sat where it sits.
 *
 * Deliberately coarse. Nobody needs to know an application has been in
 * Applied for six days and four hours; the useful question is whether it has
 * been a while.
 */
export function elapsed(from: Date, now: Date = new Date()): string {
  const seconds = Math.max(0, Math.floor((now.getTime() - from.getTime()) / 1000))
  const days = Math.floor(seconds / 86_400)

  if (seconds < 3_600) return 'just now'
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d`
  if (days < 30) return `${Math.floor(days / 7)}w`
  if (days < 365) return `${Math.floor(days / 30)}mo`
  return `${Math.floor(days / 365)}y`
}
