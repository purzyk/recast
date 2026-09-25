import { signOut } from '@/auth'
import * as buttonStyles from './button.css'

export function SignOut({ className = buttonStyles.button.ghost }: { className?: string }) {
  return (
    <form
      action={async () => {
        'use server'
        await signOut({ redirectTo: '/signin' })
      }}
    >
      <button type="submit" className={className}>
        Sign out
      </button>
    </form>
  )
}
