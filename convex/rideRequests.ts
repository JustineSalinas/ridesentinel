import { v, ConvexError } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireProfile, requireVerified, isVerified } from './lib/authz'
import { ILOILO_DEMO_ROUTE } from './lib/iloiloRoute'

const REQUEST_WINDOW_MS = 15 * 60 * 1000 // open requests auto-expire after 15 minutes
const AVAILABILITY_TTL_MS = 15 * 60 * 1000 // a driver who went quiet this long reads as offline

function isOnline(availableSince: number | undefined): boolean {
  return !!availableSince && Date.now() - availableSince < AVAILABILITY_TTL_MS
}

// mockFareEstimate: a demo-only display number, not a real fare quote.
// There is no distance, geocoding, or routing input here on purpose — see
// the rideRequests comment in schema.ts. Never wire this to anything that
// collects or moves money; it exists purely so a demo/walkthrough shows a
// fare-shaped number next to a request.
function mockFareEstimate() {
  const base = 40 + Math.floor(Math.random() * 40) // ₱40–79 base
  return {
    estimatedFareMinPhp: base,
    estimatedFareMaxPhp: base + 20,
    estimatedEtaMinutes: 3 + Math.floor(Math.random() * 7), // 3–9 min
  }
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
      ...mockFareEstimate(),
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

// simulateAcceptRequest: demo-only convenience for live walkthroughs (e.g.
// a capstone defense) so a presenter doesn't need a second logged-in driver
// session just to show the "matched" state. Passenger-only, and only on
// their own open request. Matches with any already-verified driver profile
// in the system — preferring one currently online — never a synthetic/fake
// account, so the "driver" shown is always a real verified profile. This is
// not a bypass of verification or the QR handshake: everything downstream
// (QR scan, confirm, rate) still goes through the real flow untouched.
export const simulateAcceptRequest = mutation({
  args: { requestId: v.id('rideRequests') },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx)
    if (profile.rideRole !== 'passenger') throw new ConvexError('NOT_A_PASSENGER')

    const request = await ctx.db.get(args.requestId)
    if (!request || request.passengerId !== profile.userId) throw new ConvexError('NOT_FOUND')
    if (request.status !== 'open') throw new ConvexError('NOT_OPEN')

    const drivers = await ctx.db
      .query('profiles')
      .filter((q) => q.eq(q.field('rideRole'), 'driver'))
      .filter((q) => q.eq(q.field('tier'), 'id_verified'))
      .take(50)
    if (drivers.length === 0) throw new ConvexError('DEMO_NO_DRIVER')

    const online = drivers.filter((d) => isOnline(d.availableSince))
    const driver = online[0] ?? drivers[0]

    await ctx.db.patch(request._id, {
      status: 'accepted',
      driverId: driver.userId,
      acceptedAt: Date.now(),
    })
  },
})

// assertParty: both GPS-sim and SOS are usable by either side of an
// accepted ride — this is the one check shared by both.
function assertParty(request: { passengerId: string; driverId?: string }, userId: string) {
  if (request.passengerId !== userId && request.driverId !== userId) throw new ConvexError('NOT_FOUND')
}

// advanceRouteProgress: demo-only "simulate GPS tracking" — there is no
// real device location anywhere in this app. Either side of an accepted
// ride can nudge the shared marker along the fixed Iloilo route
// (lib/iloiloRoute.ts); the client drives the pacing (a button or a timer),
// this just clamps and persists the fraction so both parties' screens (and
// the live-share page) agree on where the marker is.
export const advanceRouteProgress = mutation({
  args: { requestId: v.id('rideRequests'), progress: v.number() },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx)
    const request = await ctx.db.get(args.requestId)
    if (!request) throw new ConvexError('NOT_FOUND')
    assertParty(request, profile.userId)
    if (request.status !== 'accepted') throw new ConvexError('NOT_ACCEPTED')

    const clamped = Math.min(1, Math.max(0, args.progress))
    await ctx.db.patch(request._id, { routeProgress: clamped })
  },
})

// generateShareLink: passenger-only. Mints a random, unguessable token so a
// trusted contact can open a no-login page showing this ride's sanitized,
// read-only status (see getSharedRide). Idempotent — returns the existing
// token if one was already minted for this ride.
export const generateShareLink = mutation({
  args: { requestId: v.id('rideRequests') },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx)
    const request = await ctx.db.get(args.requestId)
    if (!request || request.passengerId !== profile.userId) throw new ConvexError('NOT_FOUND')
    if (request.status !== 'accepted') throw new ConvexError('NOT_ACCEPTED')
    if (request.shareToken) return request.shareToken

    const token = crypto.randomUUID().replace(/-/g, '')
    await ctx.db.patch(request._id, { shareToken: token })
    return token
  },
})

// getSharedRide: the ONLY public (no-auth) read in this codebase — by
// design, since the whole point is a trusted contact with no account can
// open it. Deliberately returns the smallest sanitized projection: no
// phone, no email, no exact note/destination text, nothing an attacker
// scanning random tokens could use beyond "a ride matching this token is
// in progress." Looking up by an unguessable, server-generated token is
// the access control here — same trust model as the QR nonce (D3).
export const getSharedRide = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const request = await ctx.db
      .query('rideRequests')
      .withIndex('by_shareToken', (q) => q.eq('shareToken', args.token))
      .unique()
    if (!request) return null

    const driverProfile = request.driverId
      ? await ctx.db
          .query('profiles')
          .withIndex('by_userId', (q) => q.eq('userId', request.driverId!))
          .unique()
      : null

    return {
      status: request.status,
      routeProgress: request.routeProgress ?? 0,
      sosActive: !!request.sosAt,
      estimatedEtaMinutes: request.estimatedEtaMinutes,
      driver: driverProfile
        ? {
            displayName: driverProfile.displayName,
            verified: isVerified(driverProfile),
            photoUrl: driverProfile.avatarStorageId ? await ctx.storage.getUrl(driverProfile.avatarStorageId) : null,
          }
        : null,
    }
  },
})

// sosAlert: demo-only panic button for either side of an accepted ride.
// This does NOT call 911 or any real emergency service, and does not
// notify anyone outside this app — it only (a) flags the ride so the
// live-share page shows a help banner, and (b) files a `reports` row +
// auditLog entry so an admin sees it in the real moderation queue, exactly
// like a passenger-filed report would.
export const sosAlert = mutation({
  args: { requestId: v.id('rideRequests'), note: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx)
    const request = await ctx.db.get(args.requestId)
    if (!request) throw new ConvexError('NOT_FOUND')
    assertParty(request, profile.userId)
    if (request.status !== 'accepted') throw new ConvexError('NOT_ACCEPTED')

    const otherPartyId = request.passengerId === profile.userId ? request.driverId : request.passengerId

    await ctx.db.patch(request._id, { sosAt: Date.now() })
    await ctx.db.insert('reports', {
      reporterId: profile.userId,
      reportedUserId: otherPartyId,
      reason: 'abusive_or_unsafe',
      details: args.note?.slice(0, 200) ?? 'SOS triggered during an in-progress ride (demo).',
      status: 'open',
      createdAt: Date.now(),
    })
    await ctx.db.insert('auditLog', {
      actorId: profile.userId,
      action: 'ride.sos',
      targetType: 'rideRequests',
      targetId: request._id,
      createdAt: Date.now(),
    })
  },
})

// checkInSafe: passenger-only "yes, I arrived safely" — separate from the
// star rating, and the only write to safetyCheckedInAt in this codebase.
export const checkInSafe = mutation({
  args: { requestId: v.id('rideRequests') },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx)
    const request = await ctx.db.get(args.requestId)
    if (!request || request.passengerId !== profile.userId) throw new ConvexError('NOT_FOUND')
    if (request.status !== 'accepted') throw new ConvexError('NOT_ACCEPTED')
    await ctx.db.patch(request._id, { safetyCheckedInAt: Date.now() })
  },
})

// demoRouteCoordinates: exposes the fixed Iloilo route so the client can
// draw it without duplicating the coordinate list.
export const demoRouteCoordinates = query({
  args: {},
  handler: async () => ILOILO_DEMO_ROUTE,
})

// myActiveRideForDriver: the driver-side mirror of myActiveRequest — a
// driver's own currently-accepted ride (if any), with the passenger's
// hand-picked projection, so the driver app can show the same GPS-sim /
// SOS / safety surfaces the passenger sees.
export const myActiveRideForDriver = query({
  args: {},
  handler: async (ctx) => {
    const profile = await requireProfile(ctx)
    if (profile.rideRole !== 'driver') return null

    const request = await ctx.db
      .query('rideRequests')
      .withIndex('by_driverId', (q) => q.eq('driverId', profile.userId))
      .filter((q) => q.eq(q.field('status'), 'accepted'))
      .order('desc')
      .first()
    if (!request) return null

    const passengerProfile = await ctx.db
      .query('profiles')
      .withIndex('by_userId', (q) => q.eq('userId', request.passengerId))
      .unique()

    return {
      request,
      passenger: passengerProfile
        ? {
            displayName: passengerProfile.displayName,
            photoUrl: passengerProfile.avatarStorageId
              ? await ctx.storage.getUrl(passengerProfile.avatarStorageId)
              : null,
          }
        : null,
    }
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
          verified: isVerified(driverProfile),
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
