import { v, ConvexError } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireProfile, requireVerified, isVerified } from './lib/authz'

const REQUEST_WINDOW_MS = 15 * 60 * 1000 // open requests auto-expire after 15 minutes
const AVAILABILITY_TTL_MS = 15 * 60 * 1000 // a driver who went quiet this long reads as offline

function isOnline(availableSince: number | undefined): boolean {
  return !!availableSince && Date.now() - availableSince < AVAILABILITY_TTL_MS
}

// setAvailability: driver-only "I'm online" toggle. Passengers don't have
// one — there's nothing for a passenger to be "available" for.
export const setAvailability = mutation({
  args: { online: v.boolean() },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx)
    if (profile.rideRole !== 'driver') throw new ConvexError('NOT_A_DRIVER')
    requireVerified(profile)
    await ctx.db.patch(profile._id, { availableSince: args.online ? Date.now() : undefined })
  },
})

// requestRide: the only way a `rideRequests` row gets created. One open
// request per passenger at a time — same "no double-pending" shape as
// verificationRequests.submit. City-wide, not scoped to any district —
// any online verified driver anywhere in Iloilo can see and accept it.
export const requestRide = mutation({
  args: {
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx)
    if (profile.rideRole !== 'passenger') throw new ConvexError('NOT_A_PASSENGER')
    requireVerified(profile)

    const existing = await ctx.db
      .query('rideRequests')
      .withIndex('by_passengerId', (q) => q.eq('passengerId', profile.userId))
      .filter((q) => q.eq(q.field('status'), 'open'))
      .first()
    if (existing) throw new ConvexError('REQUEST_ALREADY_OPEN')

    const now = Date.now()
    return await ctx.db.insert('rideRequests', {
      passengerId: profile.userId,
      note: args.note?.slice(0, 200),
      status: 'open',
      createdAt: now,
      expiresAt: now + REQUEST_WINDOW_MS,
    })
  },
})

// cancelRequest: passenger-only, and only their own open request.
export const cancelRequest = mutation({
  args: { requestId: v.id('rideRequests') },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx)
    const request = await ctx.db.get(args.requestId)
    if (!request || request.passengerId !== profile.userId) throw new ConvexError('NOT_FOUND')
    if (request.status !== 'open') return
    await ctx.db.patch(request._id, { status: 'cancelled' })
  },
})

// acceptRequest: atomically claim an open request, same serializable-
// transaction race guard qr.scanQr uses for nonce claiming — two drivers
// tapping the same request at once can't both win it.
export const acceptRequest = mutation({
  args: { requestId: v.id('rideRequests') },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx)
    if (profile.rideRole !== 'driver') throw new ConvexError('NOT_A_DRIVER')
    requireVerified(profile)

    const request = await ctx.db.get(args.requestId)
    if (!request) throw new ConvexError('NOT_FOUND')
    if (request.status !== 'open' || request.expiresAt < Date.now()) throw new ConvexError('NOT_OPEN')

    await ctx.db.patch(request._id, {
      status: 'accepted',
      driverId: profile.userId,
      acceptedAt: Date.now(),
    })
  },
})

// myActiveRequest: a passenger's own open/accepted request, with the
// accepted driver's hand-picked projection once matched (same fields
// otherPartyProjection exposes elsewhere — never phone/email).
export const myActiveRequest = query({
  args: {},
  handler: async (ctx) => {
    const profile = await requireProfile(ctx)
    if (profile.rideRole !== 'passenger') return null

    const request = await ctx.db
      .query('rideRequests')
      .withIndex('by_passengerId', (q) => q.eq('passengerId', profile.userId))
      .order('desc')
      .filter((q) => q.or(q.eq(q.field('status'), 'open'), q.eq(q.field('status'), 'accepted')))
      .first()
    if (!request) return null

    let driver = null
    if (request.driverId) {
      const driverProfile = await ctx.db
        .query('profiles')
        .withIndex('by_userId', (q) => q.eq('userId', request.driverId!))
        .unique()
      if (driverProfile) {
        driver = {
          userId: driverProfile.userId,
          displayName: driverProfile.displayName,
          photoUrl: driverProfile.avatarStorageId
            ? await ctx.storage.getUrl(driverProfile.avatarStorageId)
            : null,
        }
      }
    }
    return { request, driver }
  },
})

// listOpenForDriver: every open request city-wide — there's no district to
// narrow by. A driver only sees this once they've gone online.
export const listOpenForDriver = query({
  args: {},
  handler: async (ctx) => {
    const profile = await requireProfile(ctx)
    if (profile.rideRole !== 'driver' || !isVerified(profile) || !isOnline(profile.availableSince)) {
      return []
    }

    const open = await ctx.db
      .query('rideRequests')
      .withIndex('by_status', (q) => q.eq('status', 'open'))
      .order('desc')
      .take(20)

    const now = Date.now()
    const rows = []
    for (const request of open) {
      if (request.expiresAt < now) continue
      const passenger = await ctx.db
        .query('profiles')
        .withIndex('by_userId', (q) => q.eq('userId', request.passengerId))
        .unique()
      if (!passenger) continue
      rows.push({
        request,
        passenger: {
          displayName: passenger.displayName,
          photoUrl: passenger.avatarStorageId ? await ctx.storage.getUrl(passenger.avatarStorageId) : null,
        },
      })
    }
    return rows
  },
})
