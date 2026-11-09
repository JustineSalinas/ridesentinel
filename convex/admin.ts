import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
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
