import { v, ConvexError } from 'convex/values'
import { mutation, query, type QueryCtx } from './_generated/server'
import type { Id } from './_generated/dataModel'
import { requireProfile } from './lib/authz'
import { getRatingSummary } from './lib/ratings'

const CONFIRM_WINDOW_MS = 10 * 60 * 1000
const RATING_WINDOW_MS = 48 * 60 * 60 * 1000

// The hand-picked projection scan-qr/confirm-meeting return for "the other
// person" — never phone, email, or any other field (SPEC.md §6.2).
async function otherPartyProjection(ctx: QueryCtx, userId: Id<'users'>) {
  const profile = await ctx.db
    .query('profiles')
    .withIndex('by_userId', (q) => q.eq('userId', userId))
    .unique()
  if (!profile) return null
  return {
    userId,
    displayName: profile.displayName,
    rideRole: profile.rideRole,
    tier: profile.tier,
    photoUrl: profile.avatarStorageId ? await ctx.storage.getUrl(profile.avatarStorageId) : null,
    ratingSummary: await getRatingSummary(ctx, userId),
  }
}

export const getInteraction = query({
  args: { interactionId: v.id('interactions') },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx)
    const interaction = await ctx.db.get(args.interactionId)
    if (!interaction) return null
    const isA = interaction.userA === profile.userId
    const isB = interaction.userB === profile.userId
    if (!isA && !isB) throw new ConvexError('NOT_A_PARTY')

    const other = await otherPartyProjection(ctx, isA ? interaction.userB : interaction.userA)
    return { interaction, other, myRole: isA ? ('A' as const) : ('B' as const) }
  },
})

// myOpenScan: powers the "someone scanned your QR" modal on My QR — a plain
// reactive query stands in for the Supabase Realtime subscription the SQL
// design used (SPEC.md §6.2).
export const myOpenScan = query({
  args: {},
  handler: async (ctx) => {
    const profile = await requireProfile(ctx)
    const recent = await ctx.db
      .query('interactions')
      .withIndex('by_userA', (q) => q.eq('userA', profile.userId))
      .order('desc')
      .take(5)
    const open = recent.find((i) => i.status === 'scanned' && Date.now() - i.scannedAt < CONFIRM_WINDOW_MS)
    if (!open) return null
    return { interaction: open, other: await otherPartyProjection(ctx, open.userB) }
  },
})

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const profile = await requireProfile(ctx)
    const [asA, asB] = await Promise.all([
      ctx.db.query('interactions').withIndex('by_userA', (q) => q.eq('userA', profile.userId)).order('desc').take(50),
      ctx.db.query('interactions').withIndex('by_userB', (q) => q.eq('userB', profile.userId)).order('desc').take(50),
    ])
    const all = [...asA, ...asB].sort((a, b) => b.scannedAt - a.scannedAt).slice(0, 50)

    const rows = []
    for (const interaction of all) {
      const isA = interaction.userA === profile.userId
      const other = await otherPartyProjection(ctx, isA ? interaction.userB : interaction.userA)
      const myRating = await ctx.db
        .query('ratings')
        .withIndex('by_interaction_rater', (q) =>
          q.eq('interactionId', interaction._id).eq('raterId', profile.userId),
        )
        .unique()
      rows.push({ interaction, other, myRating })
    }
    return rows
  },
})

// confirmMeeting: B confirms first, then A sees B confirmed and confirms
// back (docs/SPEC.md §6.3 DECISION) — A cannot confirm before B.
export const confirmMeeting = mutation({
  args: { interactionId: v.id('interactions') },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx)
    const interaction = await ctx.db.get(args.interactionId)
    if (!interaction) throw new ConvexError('NOT_FOUND')
    const isA = interaction.userA === profile.userId
    const isB = interaction.userB === profile.userId
    if (!isA && !isB) throw new ConvexError('NOT_A_PARTY')
    if (interaction.status !== 'scanned') throw new ConvexError('NOT_SCANNED')

    if (Date.now() - interaction.scannedAt > CONFIRM_WINDOW_MS) {
      await ctx.db.patch(args.interactionId, { status: 'expired' })
      throw new ConvexError('EXPIRED')
    }

    if (isB) {
      if (!interaction.bConfirmedAt) await ctx.db.patch(args.interactionId, { bConfirmedAt: Date.now() })
      return
    }

    if (!interaction.bConfirmedAt) throw new ConvexError('WAIT_FOR_OTHER')
    const now = Date.now()
    await ctx.db.patch(args.interactionId, {
      aConfirmedAt: now,
      status: 'confirmed',
      ratingWindowEndsAt: now + RATING_WINDOW_MS,
    })
  },
})

export const cancelInteraction = mutation({
  args: {
    interactionId: v.id('interactions'),
    reason: v.union(v.literal('face_mismatch'), v.literal('other')),
    report: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx)
    const interaction = await ctx.db.get(args.interactionId)
    if (!interaction) throw new ConvexError('NOT_FOUND')
    const isA = interaction.userA === profile.userId
    const isB = interaction.userB === profile.userId
    if (!isA && !isB) throw new ConvexError('NOT_A_PARTY')
    if (interaction.status !== 'scanned') throw new ConvexError('NOT_SCANNED')

    await ctx.db.patch(args.interactionId, { status: 'cancelled', cancelReason: args.reason })

    if (args.reason === 'face_mismatch' && args.report) {
      await ctx.db.insert('reports', {
        reporterId: profile.userId,
        reportedUserId: isA ? interaction.userB : interaction.userA,
        interactionId: args.interactionId,
        reason: 'impersonation',
        status: 'open',
        createdAt: Date.now(),
      })
    }
  },
})
