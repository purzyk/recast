import Link from 'next/link'
import * as styles from './applicationCard.css'
import { srOnly } from '@/styles/utils.css'
import { EXTERNAL_MARK } from '@/lib/status'
import { elapsed } from '@/lib/elapsed'
import type { BoardCard } from '@/lib/applications'

/**
 * A link, not an article: it opens the detail view, so it has to be keyboard
 * reachable and take the focus ring. The status tone comes from an ancestor —
 * the column sets it once.
 */
export function ApplicationCard({ card }: { card: BoardCard }) {
  return (
    <li>
      <Link href={`/applications/${card.id}`} className={styles.card}>
        <span className={styles.spine} aria-hidden />
        <span className={styles.body}>
          <span className={styles.top}>
            <span className={styles.company}>{card.company}</span>
            {card.hasSource && (
              <span className={styles.externalMark}>
                <svg width={10} height={10} viewBox={EXTERNAL_MARK.viewBox} aria-hidden focusable="false">
                  <path
                    d={EXTERNAL_MARK.d}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={EXTERNAL_MARK.strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {/* A title attribute is unreliable for screen readers and
                    invisible on touch. */}
                <span className={srOnly}>Original posting saved</span>
              </span>
            )}
          </span>
          <span className={styles.role}>{card.role}</span>
          <span className={styles.age}>{elapsed(card.since)}</span>
        </span>
      </Link>
    </li>
  )
}
