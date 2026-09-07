import { signOut } from '@/auth'
import * as buttonStyles from './button.css'

export function SignOut() {
  return (
    <form
      action={async () => {
        'use server'
        await signOut({ redirectTo: '/signin' })
      }}
    >
      <button type="submit" className={buttonStyles.button.ghost}>
        Sign out
      </button>
    </form>
  )
}
