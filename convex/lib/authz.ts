import type { MutationCtx, QueryCtx } from '../_generated/server'
import type { Doc, Id } from '../_generated/dataModel'

/**
 * Convex has no RLS — these are the only place "who can do this" gets
 * decided (docs/SPEC.md §5). Every query/mutation that isn't public must
 * call one of these first; never re-implement the check inline.
 */

export async function getUserIdOrNull(ctx: QueryCtx | MutationCtx): Promise<Id<'users'> | null> {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) return null
  return identity.subject.split('|')[0] as Id<'users'>
}

export async function requireUserId(ctx: QueryCtx | MutationCtx): Promise<Id<'users'>> {
  const userId = await getUserIdOrNull(ctx)
  if (!userId) throw new Error('UNAUTHENTICATED')
  return userId
}

export async function requireProfile(ctx: QueryCtx | MutationCtx): Promise<Doc<'profiles'>> {
  const userId = await requireUserId(ctx)
  const profile = await ctx.db
    .query('profiles')
    .withIndex('by_userId', (q) => q.eq('userId', userId))
    .unique()
  if (!profile) throw new Error('NO_PROFILE')
  if (profile.suspendedAt) throw new Error('SUSPENDED')
  return profile
}

export async function requireAdmin(ctx: QueryCtx | MutationCtx): Promise<Doc<'profiles'>> {
  const profile = await requireProfile(ctx)
  if (profile.role !== 'admin') throw new Error('NOT_ADMIN')
  return profile
}

export function isVerified(profile: Doc<'profiles'>): boolean {
  return profile.tier === 'id_verified' && (!profile.tierExpiresAt || profile.tierExpiresAt > Date.now())
}

export function requireVerified(profile: Doc<'profiles'>) {
  if (!isVerified(profile)) throw new Error('NOT_VERIFIED')
}
