import { Password } from '@convex-dev/auth/providers/Password'
import { convexAuth } from '@convex-dev/auth/server'

// Email+password only, matching docs/SPEC.md §2's decision to turn off
// email confirmation for the pilot — the Password provider sends no
// verification email unless one is explicitly configured, so this is the
// default, not something we had to disable.
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
})
