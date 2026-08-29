# Auth — verified approach

**Verdict: Auth.js v5 works with Next 16.** Built, deployed locally, and the
protection boundary tested route by route. Not yet implemented — this is the
recipe, written down because three of the four gotchas below cost an hour each
to find and none of them announce themselves.

## Shape

Google sign-in via Auth.js, **JWT sessions** — no adapter, no session tables,
nothing added to SCHEMA.md. Google proves someone holds a Google account; an
**email allowlist** proves they are you. That allowlist is the whole security
model.

Versions as tested: `next-auth@5.0.0-beta.32` against `next@16.3.3`. v5 is
still beta after a long run; v4 is the stable tag but carries the older
Pages-Router-era API.

## The four gotchas

**1. `middleware.ts` is deprecated in Next 16 — the file is now `proxy.ts`,
and the export must be named `proxy`.** Every Auth.js doc says
`export { auth as middleware }`. Using the old filename builds with a
deprecation warning; using the new filename with the old export name fails
loudly. Correct form:

```ts
// src/proxy.ts
export { auth as proxy } from '@/auth'
```

**2. Wrapping the proxy in `auth` does not protect anything on its own.**
Without an `authorized` callback it attaches the session and lets every
request through. Verified: `/` returned **200** before adding it, 307 after.
This is the dangerous one — the app looks protected.

```ts
callbacks: {
  authorized({ auth: session }) {
    return Boolean(session?.user)
  },
}
```

**3. `trustHost: true` is required anywhere that isn't Vercel.** Auth.js only
trusts the Host header automatically on Vercel. On Cloud Run every request
fails with `UntrustedHost`, surfacing as a vague *"There was a problem with
the server configuration"* that names nothing.

**4. `api/auth` must be excluded from the proxy matcher.** Google redirects to
`/api/auth/callback/google`; if the proxy guards that path, the callback is
bounced to sign-in, which redirects to Google, forever. Verified as a real
307 bounce before the fix.

```ts
export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}
```

## Verified boundary

With all four applied:

| Path | Result |
|---|---|
| `/`, `/api/health`, `/api/hello` | 307 → sign-in |
| `/api/auth/signin`, `/providers`, `/csrf` | 200 |
| `/api/auth/callback/google` | reaches Auth.js, no bounce |

## The config

```ts
// src/auth.ts
import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'

const allowed = (process.env.AUTH_ALLOWED_EMAILS ?? '')
  .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: 'jwt' },
  trustHost: true,
  callbacks: {
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
```

Plus `src/app/api/auth/[...nextauth]/route.ts`:

```ts
import { handlers } from '@/auth'
export const { GET, POST } = handlers
```

## Still to do when implementing

- **Google Cloud console:** OAuth consent screen, then credentials. Basic `email`/`profile` scopes need no Google verification review. Redirect URIs must list **both** `https://recast.purzycki.pl/api/auth/callback/google` and the `*.run.app` URL, exactly.
- **Secrets:** `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_ALLOWED_EMAILS` into Secret Manager alongside `database-url`, mounted the same way. Deploying the app with auth wired but the secrets absent will break the live site.
- **A decision about `/api/health`.** It is currently protected by the matcher above, which is right — it reports database reachability and a row count, which should not be public. But it also means no unauthenticated deploy check. If external monitoring is wanted later, add a separate liveness route that returns `{ok:true}` and nothing else.

## Why not a password

Considered, and simpler — roughly a tenth of the work. Rejected because it
means a shared secret living in an env var, and this project has already put
one credential through a chat transcript. Nothing to leak beats a short
secret. On CV value the two are equivalent and both are dwarfed by Janus,
which is an actual OIDC identity service; pick on security, not résumé.
