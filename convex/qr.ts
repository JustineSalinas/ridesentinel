import { v, ConvexError } from 'convex/values'
import { mutation } from './_generated/server'
import { requireProfile, isVerified } from './lib/authz'

const QR_TTL_MS = 60 * 1000

// issueQr: the nonce is a plain random string, not an HMAC-signed token
// (docs/DECISIONS.md) — only this mutation can ever create a qrTokens row,
// so there's nothing client-side left for a signature to protect against.
export const issueQr = mutation({
  args: {},
  handler: async (ctx) => {
    const profile = await requireProfile(ctx)
    if (!isVerified(profile)) throw new ConvexError('NOT_VERIFIED')

    const issuedAt = Date.now()
    const nonce = crypto.randomUUID()
    await ctx.db.insert('qrTokens', {
      nonce,
      userId: profile.userId,
      issuedAt,
      expiresAt: issuedAt + QR_TTL_MS,
    })
    return { nonce, expiresAt: issuedAt + QR_TTL_MS }
  },
})

// scanQr: every branch logs a scanEvents row before throwing, matching the
// outcomes SPEC.md §6.2 and §15 need for the pilot's scan-success metric.
// The usedAt patch is the race guard: two concurrent scans of the same
// nonce both read usedAt=null in their own transaction, but Convex's OCC
// detects the write conflict on commit and retries one — on retry it
// re-reads the row, sees usedAt already set, and throws REUSED. Exactly one
// scan ever wins, with no explicit locking.
export const scanQr = mutation({
  args: { nonce: v.string() },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx)
    const now = Date.now()

    if (!isVerified(profile)) {
      await ctx.db.insert('scanEvents', { scannerId: profile.userId, outcome: 'not_verified', createdAt: now })
      throw new ConvexError('NOT_VERIFIED')
    }

    const token = await ctx.db
      .query('qrTokens')
      .withIndex('by_nonce', (q) => q.eq('nonce', args.nonce))
      .unique()

    if (!token) {
      await ctx.db.insert('scanEvents', { scannerId: profile.userId, outcome: 'expired', createdAt: now })
      throw new ConvexError('EXPIRED')
    }
    if (token.expiresAt < now) {
      await ctx.db.insert('scanEvents', {
        scannerId: profile.userId,
        ownerId: token.userId,
        outcome: 'expired',
        createdAt: now,
      })
      throw new ConvexError('EXPIRED')
    }
    if (token.usedAt) {
      await ctx.db.insert('scanEvents', {
        scannerId: profile.userId,
        ownerId: token.userId,
        outcome: 'reused',
        createdAt: now,
      })
      throw new ConvexError('REUSED')
    }
    if (token.userId === profile.userId) {
      await ctx.db.insert('scanEvents', {
        scannerId: profile.userId,
        ownerId: token.userId,
        outcome: 'self_scan',
        createdAt: now,
      })
      throw new ConvexError('SELF_SCAN')
    }

    await ctx.db.patch(token._id, { usedAt: now, usedBy: profile.userId })

    const interactionId = await ctx.db.insert('interactions', {
      nonce: args.nonce,
      userA: token.userId,
      userB: profile.userId,
      scannedAt: now,
      status: 'scanned',
    })

    await ctx.db.insert('scanEvents', {
      scannerId: profile.userId,
      ownerId: token.userId,
      outcome: 'ok',
      interactionId,
      createdAt: now,
    })

    return { interactionId }
  },
})
