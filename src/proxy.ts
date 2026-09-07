// Next 16 renamed the `middleware` convention to `proxy`, and the exported
// function must be named `proxy` (or be the default export). Auth.js docs
// still show `export { auth as middleware }` — that builds without complaint
// and protects nothing.
export { auth as proxy } from '@/auth'

export const config = {
  // Two exclusions, both load-bearing:
  //  - `api/auth`: Google redirects back to /api/auth/callback/google. If the
  //    proxy guards that path the callback is bounced to sign-in, which
  //    redirects to Google, forever.
  //  - `signin`: the page unauthenticated users are sent to. Guarding it
  //    would redirect it to itself.
  matcher: ['/((?!api/auth|signin|_next/static|_next/image|favicon.ico).*)'],
}
