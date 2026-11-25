import { v, ConvexError } from 'convex/values'
import { mutation, query, internalMutation } from './_generated/server'
import { requireAdmin } from './lib/authz'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000
const TWELVE_MONTHS_MS = 365 * 24 * 60 * 60 * 1000

// listPendingVerifications: oldest first, per SPEC.md §7's admin queue order.
export const listPendingVerifications = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    return await ctx.db
      .query('verificationRequests')
      .withIndex('by_status', (q) => q.eq('status', 'pending'))
      .order('asc')
      .take(50)
  },
})

export const getVerificationDetail = query({
  args: { requestId: v.id('verificationRequests') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const request = await ctx.db.get(args.requestId)
    if (!request) return null
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_userId', (q) => q.eq('userId', request.userId))
      .unique()
    return { request, displayName: profile?.displayName ?? 'Unknown' }
  },
})

// getFileUrl: audit the view, THEN hand back a signed URL — never the other
// way around (SPEC.md §6.5). If the audit insert throws, Convex rolls the
// whole mutation back, so no URL is ever returned without a logged view.
export const getFileUrl = mutation({
  args: { requestId: v.id('verificationRequests'), kind: v.union(v.literal('id'), v.literal('selfie')) },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx)
    const request = await ctx.db.get(args.requestId)
    if (!request) throw new Error('NOT_FOUND')
    const storageId = args.kind === 'id' ? request.idPhotoStorageId : request.selfieStorageId
    if (!storageId) return null

    await ctx.db.insert('auditLog', {
      actorId: admin.userId,
      action: 'file.view',
      targetType: 'verificationRequests',
      targetId: args.requestId,
      metadata: { kind: args.kind },
      createdAt: Date.now(),
    })

    return await ctx.storage.getUrl(storageId)
  },
})

export const reviewVerification = mutation({
  args: {
    requestId: v.id('verificationRequests'),
    decision: v.union(v.literal('approve'), v.literal('reject')),
    reason: v.optional(v.string()),
    confirmed18Plus: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx)
    const request = await ctx.db.get(args.requestId)
    if (!request) throw new Error('NOT_FOUND')
    if (request.status !== 'pending') throw new Error('ALREADY_DECIDED')
    if (args.decision === 'reject' && !args.reason) throw new Error('REASON_REQUIRED')
    if (args.decision === 'approve' && !args.confirmed18Plus) throw new Error('MUST_CONFIRM_18')

    const now = Date.now()
    await ctx.db.patch(args.requestId, {
      status: args.decision === 'approve' ? 'approved' : 'rejected',
      reviewerId: admin.userId,
      reason: args.reason,
      decidedAt: now,
      filesDeleteAfter: now + THIRTY_DAYS_MS,
    })

    if (args.decision === 'approve') {
      const profile = await ctx.db
        .query('profiles')
        .withIndex('by_userId', (q) => q.eq('userId', request.userId))
        .unique()
      if (profile) {
        await ctx.db.patch(profile._id, { tier: 'id_verified', tierExpiresAt: now + TWELVE_MONTHS_MS })
      }
    }

    await ctx.db.insert('auditLog', {
      actorId: admin.userId,
      action: args.decision === 'approve' ? 'verification.approve' : 'verification.reject',
      targetType: 'users',
      targetId: request.userId,
      reason: args.reason,
      createdAt: now,
    })
  },
})

export const listOpenReports = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    return await ctx.db.query('reports').withIndex('by_status', (q) => q.eq('status', 'open')).order('asc').take(50)
  },
})

export const getReportDetail = query({
  args: { reportId: v.id('reports') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const report = await ctx.db.get(args.reportId)
    if (!report) return null
    const reporter = await ctx.db
      .query('profiles')
      .withIndex('by_userId', (q) => q.eq('userId', report.reporterId))
      .unique()
    const reported = report.reportedUserId
      ? await ctx.db
          .query('profiles')
          .withIndex('by_userId', (q) => q.eq('userId', report.reportedUserId!))
          .unique()
      : null
    return {
      report,
      reporterName: reporter?.displayName ?? 'Unknown',
      reportedName: reported?.displayName ?? null,
    }
  },
})

// handleReport: reason mandatory for every action (SPEC.md §6.5); an admin
// can never act on a report about themselves.
export const handleReport = mutation({
  args: {
    reportId: v.id('reports'),
    action: v.union(
      v.literal('dismiss'),
      v.literal('warn'),
      v.literal('remove_rating'),
      v.literal('suspend'),
      v.literal('revoke_tier'),
    ),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx)
    const report = await ctx.db.get(args.reportId)
    if (!report) throw new ConvexError('NOT_FOUND')
    if (!args.reason.trim()) throw new ConvexError('REASON_REQUIRED')
    if (report.reportedUserId === admin.userId) throw new ConvexError('CANNOT_ACT_ON_SELF')

    const now = Date.now()
    const status = args.action === 'dismiss' ? 'dismissed' : args.action === 'warn' ? 'warned' : 'upheld'

    await ctx.db.patch(args.reportId, {
      status,
      action: args.action,
      handlerId: admin.userId,
      handlerReason: args.reason,
      handledAt: now,
    })

    if (args.action === 'remove_rating' && report.ratingId) {
      await ctx.db.patch(report.ratingId, { removedAt: now, removedReason: args.reason })
    }
    if (report.reportedUserId) {
      const profile = await ctx.db
        .query('profiles')
        .withIndex('by_userId', (q) => q.eq('userId', report.reportedUserId!))
        .unique()
      if (profile) {
        if (args.action === 'suspend') await ctx.db.patch(profile._id, { suspendedAt: now })
        if (args.action === 'revoke_tier') await ctx.db.patch(profile._id, { tier: 'unverified' })
      }
    }

    await ctx.db.insert('auditLog', {
      actorId: admin.userId,
      action: `report.${status === 'upheld' ? args.action : status}`,
      targetType: 'reports',
      targetId: args.reportId,
      reason: args.reason,
      createdAt: now,
    })
  },
})

export const listAuditLog = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    return await ctx.db.query('auditLog').withIndex('by_createdAt').order('desc').take(100)
  },
})

// Bootstrap tool, not a client-facing function — there is deliberately no
// way to self-promote to admin from the app (SPEC.md §4.3). Register, then
// from a terminal with the Convex CLI configured for this deployment:
//   npx convex run admin:makeAdmin '{"displayName":"Your Name"}'
export const makeAdmin = internalMutation({
  args: { displayName: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query('profiles')
      .filter((q) => q.eq(q.field('displayName'), args.displayName))
      .first()
    if (!profile) throw new ConvexError('NOT_FOUND')
    await ctx.db.patch(profile._id, { role: 'admin' })
  },
})

// getPilotMetrics: the §15 evaluation targets, computed on demand instead
// of a separate export-metrics.sql script — there's no SQL to export from.
export const getPilotMetrics = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)

    const scans = await ctx.db.query('scanEvents').take(500)
    const scanSuccessRate = scans.length ? scans.filter((s) => s.outcome === 'ok').length / scans.length : null

    const interactions = await ctx.db.query('interactions').take(500)
    const confirmedCount = interactions.filter((i) => i.status === 'confirmed').length
    const confirmationRate = interactions.length ? confirmedCount / interactions.length : null

    const allRequests = await ctx.db.query('verificationRequests').take(500)
    const decided = allRequests.filter((r) => r.decidedAt)
    const turnarounds = decided.map((r) => r.decidedAt! - r.createdAt).sort((a, b) => a - b)
    const medianTurnaroundMs = turnarounds.length ? turnarounds[Math.floor(turnarounds.length / 2)] : null
    const avgTurnaroundMs = turnarounds.length
      ? turnarounds.reduce((sum, ms) => sum + ms, 0) / turnarounds.length
      : null

    const now = Date.now()
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000
    const pendingOver24h = allRequests.filter(
      (r) => r.status === 'pending' && now - r.createdAt > TWENTY_FOUR_HOURS_MS,
    ).length

    return {
      scanSuccessRate,
      confirmationRate,
      medianTurnaroundMs,
      avgTurnaroundMs,
      pendingOver24h,
      totalDecided: decided.length,
      totalScans: scans.length,
      totalInteractions: interactions.length,
    }
  },
})

// adminListActiveRides: every currently-accepted ride, for the live-map
// dashboard. Demo-scoped like the rest of the ride-tracking feature set —
// the "location" each ride shows is still just routeProgress along the
// one fixed Iloilo route (lib/iloiloRoute.ts), never a real position.
export const adminListActiveRides = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    const rides = await ctx.db
      .query('rideRequests')
      .withIndex('by_status', (q) => q.eq('status', 'accepted'))
      .order('desc')
      .take(100)

    const rows = []
    for (const ride of rides) {
      const [passenger, driver] = await Promise.all([
        ctx.db.query('profiles').withIndex('by_userId', (q) => q.eq('userId', ride.passengerId)).unique(),
        ride.driverId
          ? ctx.db.query('profiles').withIndex('by_userId', (q) => q.eq('userId', ride.driverId!)).unique()
          : null,
      ])
      rows.push({
        requestId: ride._id,
        routeProgress: ride.routeProgress ?? 0,
        sosActive: !!ride.sosAt && !ride.sosResolvedAt,
        routeDeviationActive: !!ride.routeDeviationAt,
        passengerName: passenger?.displayName ?? 'Unknown',
        driverName: driver?.displayName ?? 'Unknown',
      })
    }
    return rows
  },
})

// adminListSosIncidents: SOS-flagged rides, newest first — a dedicated
// view separate from the general reports queue (listOpenReports above),
// since an SOS is time-sensitive in a way a routine report isn't.
export const adminListSosIncidents = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    const rides = await ctx.db.query('rideRequests').order('desc').take(300)
    const sosRides = rides.filter((r) => r.sosAt).slice(0, 50)

    const rows = []
    for (const ride of sosRides) {
      const [passenger, driver] = await Promise.all([
        ctx.db.query('profiles').withIndex('by_userId', (q) => q.eq('userId', ride.passengerId)).unique(),
        ride.driverId
          ? ctx.db.query('profiles').withIndex('by_userId', (q) => q.eq('userId', ride.driverId!)).unique()
          : null,
      ])
      rows.push({
        requestId: ride._id,
        sosAt: ride.sosAt!,
        sosResolvedAt: ride.sosResolvedAt,
        status: ride.status,
        passengerName: passenger?.displayName ?? 'Unknown',
        driverName: driver?.displayName ?? 'Unknown',
      })
    }
    return rows
  },
})

// resolveSosIncident: marks an SOS as looked-at from the incident
// dashboard. Separate from reports.handleReport — this only clears the
// urgent "needs eyes now" flag; the underlying reports row (filed by
// sosAlert) still goes through the normal moderation queue if it needs
// an action like warn/suspend.
export const resolveSosIncident = mutation({
  args: { requestId: v.id('rideRequests'), reason: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx)
    const ride = await ctx.db.get(args.requestId)
    if (!ride) throw new ConvexError('NOT_FOUND')
    if (!args.reason.trim()) throw new ConvexError('REASON_REQUIRED')

    await ctx.db.patch(ride._id, { sosResolvedAt: Date.now() })
    await ctx.db.insert('auditLog', {
      actorId: admin.userId,
      action: 'ride.sos.resolve',
      targetType: 'rideRequests',
      targetId: ride._id,
      reason: args.reason,
      createdAt: Date.now(),
    })
  },
})
