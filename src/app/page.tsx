import { AppBar } from '@/components/AppBar'
import { PipelineBoard } from '@/components/PipelineBoard'
import { getBoard, getTally } from '@/lib/applications'
import * as styles from './page.css'

// The board reflects data that changes on every write, so it is never
// prerendered.
export const dynamic = 'force-dynamic'

export default async function BoardPage() {
  const [columns, tally] = await Promise.all([getBoard(), getTally()])

  return (
    <div className={styles.shell}>
      <AppBar tally={tally} />
      <PipelineBoard columns={columns} />
    </div>
  )
}
