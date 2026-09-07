import * as styles from './pipelineBoard.css'
import * as emptyStyles from './emptyState.css'
import { statusTone } from '@/styles/status.css'
import { srOnly } from '@/styles/utils.css'
import { STATUS_LABEL } from '@/lib/status'
import { StatusGlyph } from './StatusGlyph'
import { ApplicationCard } from './ApplicationCard'
import type { BoardColumn } from '@/lib/applications'

const EMPTY_COPY: Record<string, { lead: string; sub: string }> = {
  saved: { lead: 'Nothing saved', sub: 'Postings you find land here first' },
  applied: { lead: 'Nothing applied for', sub: 'Move a card here once you send it' },
  interview: { lead: 'No interviews', sub: 'Cards land here when someone replies' },
  offer: { lead: 'No offers yet', sub: 'Cards land here when one comes in' },
  rejected: { lead: 'Nothing rejected', sub: 'Closed applications stay here' },
}

export function PipelineBoard({ columns }: { columns: BoardColumn[] }) {
  return (
    <div className={styles.board}>
      {columns.map((column) => {
        const copy = EMPTY_COPY[column.status]
        return (
          // The tone is set once per column; card spines and the rule below
          // the header read it from here.
          <section key={column.status} className={`${styles.column} ${statusTone[column.status]}`}>
            <header className={styles.columnHeader}>
              <span className={styles.columnGlyph}>
                <StatusGlyph status={column.status} />
              </span>
              <h2 className={styles.columnName}>{STATUS_LABEL[column.status]}</h2>
              <span className={styles.columnCount}>
                {column.cards.length}
                {/* Otherwise a screen reader just hears a number. */}
                <span className={srOnly}> applications</span>
              </span>
            </header>
            <div className={styles.columnRule} aria-hidden />
            <ul className={styles.stack}>
              {column.cards.length === 0 ? (
                <li className={`${emptyStyles.emptyState} ${emptyStyles.quiet}`}>
                  <p className={`${emptyStyles.line} ${emptyStyles.lead}`}>{copy.lead}</p>
                  <p className={`${emptyStyles.line} ${emptyStyles.sub}`}>{copy.sub}</p>
                </li>
              ) : (
                column.cards.map((card) => <ApplicationCard key={card.id} card={card} />)
              )}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
