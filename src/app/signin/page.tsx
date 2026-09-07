import { signIn } from '@/auth'
import * as buttonStyles from '@/components/button.css'
import * as styles from './page.css'

/**
 * The one screen an unauthenticated visitor can reach.
 *
 * Not designed in the original pass — auth was decided after it — so this is
 * built from the existing tokens rather than inventing anything: the panel is
 * surface on bg with a hairline, same as a card.
 */
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <main className={styles.shell}>
      <div className={styles.panel}>
        <h1 className={styles.wordmark}>Recast</h1>
        <p className={styles.blurb}>
          A job application tracker. Sign in to continue.
        </p>

        {error && (
          <p className={styles.error}>
            {error === 'AccessDenied'
              ? 'That account is not allowed to use this instance.'
              : 'Sign-in failed. Try again.'}
          </p>
        )}

        <form
          action={async () => {
            'use server'
            await signIn('google', { redirectTo: '/' })
          }}
        >
          <button type="submit" className={`${buttonStyles.button.primary} ${buttonStyles.large}`}>
            Continue with Google
          </button>
        </form>

        <p className={styles.note}>Single user · access is restricted by email</p>
      </div>
    </main>
  )
}
