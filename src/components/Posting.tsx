import type { ReactNode } from 'react'
import * as screen from './screen.css'
import * as styles from './posting.css'
import { highlight } from '@/lib/highlight'
import { parsePosting } from '@/lib/posting'

/**
 * A job posting with its structure restored. `phrases` are underlined where
 * they occur; each is marked once, at its first occurrence in reading order,
 * as it was when the posting rendered as one block of text.
 */
export function Posting({ text, phrases = [] }: { text: string; phrases?: string[] }) {
  let remaining = phrases

  const mark = (value: string): ReactNode => {
    if (remaining.length === 0) return value
    const segments = highlight(value, remaining)
    const found = new Set(segments.filter((s) => s.matched).map((s) => s.text.toLowerCase()))
    remaining = remaining.filter((phrase) => !found.has(phrase.trim().toLowerCase()))
    return segments.map((segment, index) =>
      segment.matched ? (
        <mark key={index} className={screen.matched} style={{ background: 'none' }}>
          {segment.text}
        </mark>
      ) : (
        segment.text
      ),
    )
  }

  return (
    <div className={styles.posting}>
      {parsePosting(text).map((block, index) => {
        switch (block.kind) {
          case 'heading':
            return (
              <h3 key={index} className={styles.heading}>
                {mark(block.text)}
              </h3>
            )
          case 'paragraph':
            return (
              <p key={index} className={styles.paragraph}>
                {mark(block.text)}
              </p>
            )
          case 'list':
            return (
              <ul key={index} className={styles.list}>
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex} className={styles.item}>
                    {mark(item)}
                  </li>
                ))}
              </ul>
            )
          case 'tags':
            return (
              <div key={index} className={styles.tags}>
                {block.label && <span className={styles.tagLabel}>{block.label}</span>}
                {block.items.map((item, itemIndex) => (
                  <span key={itemIndex} className={styles.tag}>
                    {mark(item)}
                  </span>
                ))}
              </div>
            )
        }
      })}
    </div>
  )
}
