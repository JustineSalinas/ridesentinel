import { v, ConvexError } from 'convex/values'
import { mutation, query, internalMutation } from './_generated/server'
import type { QueryCtx, MutationCtx } from './_generated/server'
import type { Id } from './_generated/dataModel'
import { requireProfile } from './lib/authz'

// listAnnouncements: the "Latest updates / advertisements" feed — the
// same read-only list for every signed-in non-admin user. No targeting,
// no per-user read state; this is the simplest version of a broadcast
// feed, not a notifications system.
export const listAnnouncements = query({
  args: {},
  handler: async (ctx) => {
    await requireProfile(ctx)
    return await ctx.db.query('announcements').withIndex('by_createdAt').order('desc').take(20)
  },
})

// listMyConversations: every ride (accepted or further along) the caller
// was a side of, with the other party's name/photo and the most recent
// message preview — the inbox list above each actual thread.
export const listMyConversations = query({
  args: {},
  handler: async (ctx) => {
    const profile = await requireProfile(ctx)

    const [asPassenger, asDriver] = await Promise.all([
      ctx.db.query('rideRequests').withIndex('by_passengerId', (q) => q.eq('passengerId', profile.userId)).collect(),
      ctx.db.query('rideRequests').withIndex('by_driverId', (q) => q.eq('driverId', profile.userId)).collect(),
    ])
    const rides = [...asPassenger, ...asDriver]
      .filter((r) => r.driverId && r.status !== 'open' && r.status !== 'expired')
      .sort((a, b) => b.createdAt - a.createdAt)

    const rows = []
    for (const ride of rides) {
      const otherPartyId = ride.passengerId === profile.userId ? ride.driverId! : ride.passengerId
      const otherProfile = await ctx.db
        .query('profiles')
        .withIndex('by_userId', (q) => q.eq('userId', otherPartyId))
        .unique()
      if (!otherProfile) continue

      const lastMessage = await ctx.db
        .query('rideMessages')
        .withIndex('by_rideRequestId', (q) => q.eq('rideRequestId', ride._id))
        .order('desc')
        .first()

      rows.push({
        rideRequestId: ride._id,
        rideStatus: ride.status,
        otherParty: {
          displayName: otherProfile.displayName,
          photoUrl: otherProfile.avatarStorageId ? await ctx.storage.getUrl(otherProfile.avatarStorageId) : null,
        },
        lastMessage: lastMessage ? { body: lastMessage.body, createdAt: lastMessage.createdAt } : null,
      })
    }
    return rows
  },
})

async function assertRideParty(
  ctx: QueryCtx | MutationCtx,
  rideRequestId: Id<'rideRequests'>,
  userId: Id<'users'>,
) {
  const ride = await ctx.db.get(rideRequestId)
  if (!ride) throw new ConvexError('NOT_FOUND')
  if (ride.passengerId !== userId && ride.driverId !== userId) throw new ConvexError('NOT_FOUND')
  return ride
}

// listMessagesForRide: the thread for one ride, oldest first. Either side
// of that ride only — same access model as everything else keyed off a
// rideRequests row in this codebase.
export const listMessagesForRide = query({
  args: { rideRequestId: v.id('rideRequests') },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx)
    await assertRideParty(ctx, args.rideRequestId, profile.userId)
    return await ctx.db
      .query('rideMessages')
      .withIndex('by_rideRequestId', (q) => q.eq('rideRequestId', args.rideRequestId))
      .order('asc')
      .take(200)
  },
})

// sendMessage: the only way a rideMessages row gets created.
export const sendMessage = mutation({
  args: { rideRequestId: v.id('rideRequests'), body: v.string() },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx)
    await assertRideParty(ctx, args.rideRequestId, profile.userId)
    const trimmed = args.body.trim().slice(0, 500)
    if (!trimmed) throw new ConvexError('EMPTY_MESSAGE')
    await ctx.db.insert('rideMessages', {
      rideRequestId: args.rideRequestId,
      senderId: profile.userId,
      body: trimmed,
      createdAt: Date.now(),
    })
  },
})

// seedAnnouncementsIfEmpty: idempotent demo content — inserts a starter
// set only the first time (table empty), safe to call more than once.
// There is no authoring UI for announcements yet; this is the only way
// they get created right now.
export const seedAnnouncementsIfEmpty = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query('announcements').first()
    if (existing) return 'already seeded'

    const now = Date.now()
    const seed: { kind: 'update' | 'ad'; title: string; body: string; ctaLabel?: string; ctaUrl?: string }[] = [
      {
        kind: 'update',
        title: 'Live ride tracking is here',
        body: 'Share your trip status with a trusted contact, get a mid-ride check-in prompt, and use SOS if something feels off — all new this week.',
      },
      {
        kind: 'update',
        title: 'Dark mode added',
        body: 'Toggle it from your Profile tab. Applies across the app except screens that are always dark by design.',
      },
      {
        kind: 'ad',
        title: 'Verified drivers ride free coffee week',
        body: 'ID-verified drivers who complete 5 rides this week get a free coffee voucher from our partner cafés in Iloilo City Proper.',
        ctaLabel: 'Learn more',
      },
    ]
    for (const a of seed) {
      await ctx.db.insert('announcements', { ...a, createdAt: now })
    }
    return 'seeded'
  },
})
