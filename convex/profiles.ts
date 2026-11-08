import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { getUserIdOrNull, requireUserId, requireProfile, isVerified } from './lib/authz'

// getMe: the one query the client polls on every protected screen to know
// its own tier/role/consent state. Never returns another user's row — that
// case doesn't exist here, there is no "get profile by id" query for users.
export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserIdOrNull(ctx)
    if (!userId) return null
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .unique()
    if (!profile) return null
    return { ...profile, verified: isVerified(profile) }
  },
})

// completeRegistration: the only mutation that can create a profile row,
// called once right after Convex Auth sign-up. role/tier are never
// client-supplied — they're hardcoded here, same guarantee the Postgres
// column-privilege revoke used to give us.
export const completeRegistration = mutation({
  args: {
    displayName: v.string(),
    rideRole: v.union(v.literal('driver'), v.literal('passenger')),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const existing = await ctx.db
      .query('profiles')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .unique()
    if (existing) throw new Error('PROFILE_EXISTS')

    if (args.displayName.length < 2 || args.displayName.length > 60) {
      throw new Error('INVALID_DISPLAY_NAME')
    }

    await ctx.db.insert('profiles', {
      userId,
      role: 'user',
      rideRole: args.rideRole,
      displayName: args.displayName,
      phone: args.phone,
      tier: 'unverified',
      createdAt: Date.now(),
    })
  },
})

// setConsent: writes the RA 10173 consent timestamp (SPEC.md §10). Nothing
// else may write this field.
export const setConsent = mutation({
  args: {},
  handler: async (ctx) => {
    const profile = await requireProfile(ctx)
    await ctx.db.patch(profile._id, { consentAt: Date.now() })
  },
})

// updateProfile: the only user-editable fields (SPEC.md §5 row for `profiles`).
export const updateProfile = mutation({
  args: {
    displayName: v.optional(v.string()),
    phone: v.optional(v.string()),
    rideRole: v.optional(v.union(v.literal('driver'), v.literal('passenger'))),
  },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx)
    const patch: Record<string, unknown> = {}
    if (args.displayName !== undefined) patch.displayName = args.displayName
    if (args.phone !== undefined) patch.phone = args.phone
    if (args.rideRole !== undefined) patch.rideRole = args.rideRole
    await ctx.db.patch(profile._id, patch)
  },
})
