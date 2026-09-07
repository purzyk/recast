import Link from 'next/link'
import * as screen from '@/components/screen.css'
import * as table from '@/components/dataTable.css'
import * as buttonStyles from '@/components/button.css'
import * as styles from './page.css'
import * as emptyStyles from '@/components/emptyState.css'
import { srOnly, tabular } from '@/styles/utils.css'
import { AppBar } from '@/components/AppBar'
import { StatusBadge } from '@/components/StatusBadge'
import { getCompanies } from '@/lib/companies'
import { elapsed } from '@/lib/elapsed'

export const dynamic = 'force-dynamic'

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ open?: string }>
}) {
  const { open } = await searchParams
  const openOnly = open === '1'
  const companies = await getCompanies(openOnly)
  const totalApplications = companies.reduce((sum, row) => sum + row.applications, 0)

  return (
    <div className={styles.shell}>
      <AppBar />

      <header className={screen.header}>
        <div>
          <p className={screen.crumb}>
            <Link href="/">Board</Link> / Companies
          </p>
          <h1 className={screen.title}>Companies</h1>
          <p className={screen.subtitle}>
            {companies.length} {companies.length === 1 ? 'company' : 'companies'} ·{' '}
            {totalApplications} {totalApplications === 1 ? 'application' : 'applications'}
          </p>
        </div>
        <div className={styles.filters}>
          <Link
            href="/companies"
            className={openOnly ? buttonStyles.button.ghost : buttonStyles.button.secondary}
          >
            All outcomes
          </Link>
          <Link
            href="/companies?open=1"
            className={openOnly ? buttonStyles.button.secondary : buttonStyles.button.ghost}
          >
            Open only
          </Link>
        </div>
      </header>

      <div className={styles.body}>
        {companies.length === 0 ? (
          <div className={emptyStyles.emptyState}>
            <p className={`${emptyStyles.line} ${emptyStyles.lead}`}>No companies yet</p>
            <p className={`${emptyStyles.line} ${emptyStyles.sub}`}>
              They appear here as soon as you add an application
            </p>
          </div>
        ) : (
          <table className={table.table}>
            <thead>
              <tr>
                <th className={table.th}>Company</th>
                <th className={table.th}>Latest status</th>
                <th className={table.th}>Role last applied for</th>
                <th className={`${table.th} ${table.num}`}>Applications</th>
                <th className={`${table.th} ${table.num}`}>Last activity</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((row) => (
                <tr key={row.id} className={table.row}>
                  <td className={`${table.td} ${styles.nameCell}`}>{row.name}</td>
                  <td className={table.td}>
                    <StatusBadge status={row.latestStatus} />
                  </td>
                  <td className={`${table.td} ${table.dimCell}`}>{row.latestRole}</td>
                  <td className={`${table.td} ${table.num}`}>
                    {row.applications > 1 ? (
                      <span className={styles.multiple}>
                        {row.applications}
                        <span className={srOnly}> applications — more than one</span>
                      </span>
                    ) : (
                      <span className={tabular}>{row.applications}</span>
                    )}
                  </td>
                  <td className={`${table.td} ${table.num}`}>{elapsed(row.lastActivity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
