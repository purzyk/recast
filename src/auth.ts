import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'

/**
 * Single-user auth. See AUTH.md for the four gotchas this configuration
 * exists to avoid.
 *
 * Google proves someone holds a Google account. It does not prove they are
 * the owner of this tool — without the allowlist below, every Google user
 * alive can sign in, and the door looks locked while standing open. The
 * allowlist is the whole security model; everything else is plumbing.
 *
 * JWT sessions, deliberately: no adapter, no session tables, nothing added to
 * the schema.
 */
const allowed = (process.env.AUTH_ALLOWED_EMAILS ?? '')
  .split(',')
  .map((entry) => entry.trim().toLowerCase())
  .filter(Boolean)

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: 'jwt' },

  // Auth.js only trusts the Host header automatically on Vercel. Behind any
  // other proxy — Cloud Run included — every request fails UntrustedHost, and
  // it surfaces as a vague "problem with the server configuration" that names
  // nothing.
  trustHost: true,

  // Our own page rather than Auth.js's default, which is functional but
  // unstyled and would be the one page in the app outside the design system.
  // `signin` is excluded from the proxy matcher, or it would guard itself.
  pages: {
    signIn: '/signin',
    error: '/signin',
  },

  callbacks: {
    // Without this, wrapping the proxy in `auth` attaches the session and
    // then lets every request through.
    authorized({ auth: session }) {
      return Boolean(session?.user)
    },

    signIn({ profile }) {
      // email_verified matters: without it the allowlist can be defeated by
      // someone who merely claims the address.
      if (!profile?.email || profile.email_verified !== true) return false
      return allowed.includes(profile.email.toLowerCase())
    },
  },
})
