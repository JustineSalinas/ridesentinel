import { v, ConvexError } from 'convex/values'
import { mutation } from './_generated/server'
import { requireProfile } from './lib/authz'

export const fileReport = mutation({
  args: {
    reason: v.union(
      v.literal('impersonation'),
      v.literal('abusive_or_unsafe'),
      v.literal('fake_or_coerced_rating'),
    ),
    details: v.optional(v.string()),
    reportedUserId: v.optional(v.id('users')),
    ratingId: v.optional(v.id('ratings')),
    interactionId: v.optional(v.id('interactions')),
  },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx)
    if (!args.reportedUserId && !args.ratingId) throw new ConvexError('MISSING_TARGET')
    if (args.details && args.details.length > 500) throw new ConvexError('DETAILS_TOO_LONG')

    await ctx.db.insert('reports', {
      reporterId: profile.userId,
      reportedUserId: args.reportedUserId,
      ratingId: args.ratingId,
      interactionId: args.interactionId,
      reason: args.reason,
      details: args.details,
      status: 'open',
      createdAt: Date.now(),
    })
  },
})
