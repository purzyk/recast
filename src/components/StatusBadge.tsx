import * as styles from './statusBadge.css'
import { statusTone } from '@/styles/status.css'
import { STATUS_LABEL, type Status } from '@/lib/status'
import { StatusGlyph } from './StatusGlyph'

export function StatusBadge({ status, large = false }: { status: Status; large?: boolean }) {
  return (
    <span className={[styles.badge, large && styles.badgeLarge, statusTone[status]].filter(Boolean).join(' ')}>
      <span className={styles.glyph}>
        <StatusGlyph status={status} size={large ? 14 : 12} />
      </span>
      {STATUS_LABEL[status]}
    </span>
  )
}
