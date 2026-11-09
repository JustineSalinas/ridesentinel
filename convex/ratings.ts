import { v, ConvexError } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireProfile } from './lib/authz'
import { getRatingSummary } from './lib/ratings'

export const getMySummary = query({
  args: {},
  handler: async (ctx) => {
    const profile = await requireProfile(ctx)
    return await getRatingSummary(ctx, profile.userId)
  },
})

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
const DAILY_CAP = 10
const UTC8_OFFSET_MS = 8 * 60 * 60 * 1000

export const getMine = query({
  args: { interactionId: v.id('interactions') },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx)
    return await ctx.db
      .query('ratings')
      .withIndex('by_interaction_rater', (q) => q.eq('interactionId', args.interactionId).eq('raterId', profile.userId))
      .unique()
  },
})

// submitRating: every check SPEC.md §4.4 lists, in the same order, with the
// same two anti-abuse rules (7-day pair cooldown, daily cap) — both
// implemented as "store it anyway with counted=false" rather than a reject,
// exactly as the SQL design specified.
export const submitRating = mutation({
  args: { interactionId: v.id('interactions'), stars: v.number() },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx)
    if (!Number.isInteger(args.stars) || args.stars < 1 || args.stars > 5) {
      throw new ConvexError('INVALID_STARS')
    }

    const interaction = await ctx.db.get(args.interactionId)
    if (!interaction) throw new ConvexError('NOT_FOUND')
    const isA = interaction.userA === profile.userId
    const isB = interaction.userB === profile.userId
    if (!isA && !isB) throw new ConvexError('NOT_A_PARTY')
    if (interaction.status !== 'confirmed') throw new ConvexError('NOT_CONFIRMED')
    if (!interaction.ratingWindowEndsAt || Date.now() >= interaction.ratingWindowEndsAt) {
      throw new ConvexError('WINDOW_CLOSED')
    }

    const existing = await ctx.db
      .query('ratings')
      .withIndex('by_interaction_rater', (q) =>
        q.eq('interactionId', args.interactionId).eq('raterId', profile.userId),
      )
      .unique()
    if (existing) throw new ConvexError('ALREADY_RATED')

    const ratedId = isA ? interaction.userB : interaction.userA
    const recentFromRater = await ctx.db
      .query('ratings')
      .withIndex('by_raterId', (q) => q.eq('raterId', profile.userId))
      .take(200)

    const now = Date.now()
    const pairCooldownHit = recentFromRater.some(
      (r) => r.ratedId === ratedId && r.counted && now - r.createdAt < SEVEN_DAYS_MS,
    )

    const nowUtc8 = now + UTC8_OFFSET_MS
    const startOfDayUtc8 = Math.floor(nowUtc8 / 86_400_000) * 86_400_000 - UTC8_OFFSET_MS
    const todaysCounted = recentFromRater.filter((r) => r.counted && r.createdAt >= startOfDayUtc8).length
    const dailyCapHit = todaysCounted >= DAILY_CAP

    await ctx.db.insert('ratings', {
      interactionId: args.interactionId,
      raterId: profile.userId,
      ratedId,
      stars: args.stars,
      counted: !pairCooldownHit && !dailyCapHit,
      flagged: false,
      createdAt: now,
    })
  },
})
