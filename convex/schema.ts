import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'
import { authTables } from '@convex-dev/auth/server'

// Convex equivalent of docs/SPEC.md §4. `authTables` gives us the `users` /
// `authSessions` / `authAccounts` tables that @convex-dev/auth needs — our
// own `profiles` table hangs off `users` by id, same split as Supabase
// auth.users + public.profiles had.
//
// There is no RLS here. Every table is reachable only through the functions
// in this folder, and each function is the single place that decides who
// may read or write it (docs/SPEC.md §5 describes the matrix those
// functions must enforce). Never add a mutation that writes a field the
// caller shouldn't control (role, tier, suspended_at, consent_at on
// `profiles`; anything on `auditLog`) — that discipline is what RLS used to
// enforce for us.

export default defineSchema({
  ...authTables,

  // D1 — users. One row per auth user, created right after sign-up.
  profiles: defineTable({
    userId: v.id('users'),
    role: v.union(v.literal('user'), v.literal('admin')),
    rideRole: v.union(v.literal('driver'), v.literal('passenger')),
    displayName: v.string(),
    phone: v.optional(v.string()),
    avatarStorageId: v.optional(v.id('_storage')),
    tier: v.union(v.literal('unverified'), v.literal('id_verified')),
    tierExpiresAt: v.optional(v.number()),
    suspendedAt: v.optional(v.number()),
    consentAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index('by_userId', ['userId']),

  // D2 — verification requests.
  verificationRequests: defineTable({
    userId: v.id('users'),
    idType: v.string(), // label only — never an ID number (SPEC.md §10)
    idPhotoStorageId: v.optional(v.id('_storage')),
    selfieStorageId: v.optional(v.id('_storage')),
    status: v.union(v.literal('pending'), v.literal('approved'), v.literal('rejected')),
    reviewerId: v.optional(v.id('users')),
    reason: v.optional(v.string()),
    decidedAt: v.optional(v.number()),
    filesDeleteAfter: v.optional(v.number()),
    filesDeletedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index('by_userId', ['userId'])
    .index('by_status', ['status']),

  // D3 — QR tokens. The nonce is a server-generated random string; because
  // only a mutation can ever create or consume one, there is no need for
  // the HMAC signing the SQL version used (DECISIONS.md) — the token never
  // has to prove its own authenticity, Convex already guarantees it came
  // from our `issueQr` mutation.
  qrTokens: defineTable({
    nonce: v.string(),
    userId: v.id('users'),
    issuedAt: v.number(),
    expiresAt: v.number(),
    usedAt: v.optional(v.number()),
    usedBy: v.optional(v.id('users')),
  })
    .index('by_nonce', ['nonce'])
    .index('by_userId', ['userId']),

  // D4 — interactions.
  interactions: defineTable({
    nonce: v.string(),
    userA: v.id('users'), // QR owner
    userB: v.id('users'), // scanner
    scannedAt: v.number(),
    bConfirmedAt: v.optional(v.number()),
    aConfirmedAt: v.optional(v.number()),
    status: v.union(
      v.literal('scanned'),
      v.literal('confirmed'),
      v.literal('cancelled'),
      v.literal('expired'),
    ),
    ratingWindowEndsAt: v.optional(v.number()),
    cancelReason: v.optional(v.string()),
  })
    .index('by_nonce', ['nonce'])
    .index('by_userA', ['userA'])
    .index('by_userB', ['userB']),

  // D5 — ratings. Only ever written by the `submitRating` mutation.
  ratings: defineTable({
    interactionId: v.id('interactions'),
    raterId: v.id('users'),
    ratedId: v.id('users'),
    stars: v.number(),
    counted: v.boolean(),
    flagged: v.boolean(),
    removedAt: v.optional(v.number()),
    removedReason: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index('by_interaction_rater', ['interactionId', 'raterId'])
    .index('by_ratedId', ['ratedId'])
    .index('by_raterId', ['raterId']),

  // D6 — reports.
  reports: defineTable({
    reporterId: v.id('users'),
    reportedUserId: v.optional(v.id('users')),
    ratingId: v.optional(v.id('ratings')),
    interactionId: v.optional(v.id('interactions')),
    reason: v.union(
      v.literal('impersonation'),
      v.literal('abusive_or_unsafe'),
      v.literal('fake_or_coerced_rating'),
    ),
    details: v.optional(v.string()),
    status: v.union(
      v.literal('open'),
      v.literal('dismissed'),
      v.literal('warned'),
      v.literal('upheld'),
    ),
    action: v.optional(
      v.union(
        v.literal('dismiss'),
        v.literal('warn'),
        v.literal('remove_rating'),
        v.literal('suspend'),
        v.literal('revoke_tier'),
      ),
    ),
    handlerId: v.optional(v.id('users')),
    handlerReason: v.optional(v.string()),
    handledAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index('by_status', ['status'])
    .index('by_reporterId', ['reporterId'])
    .index('by_reportedUserId', ['reportedUserId']),

  // D7 — audit log. Append-only: no mutation in this codebase may update or
  // delete a row here. That is the whole enforcement mechanism — there is
  // no column-privilege system to lean on the way `REVOKE UPDATE` did in
  // Postgres, so the rule is "no such mutation exists", full stop.
  auditLog: defineTable({
    actorId: v.optional(v.id('users')), // absent for system/cron actions
    action: v.string(), // 'verification.approve', 'file.view', ...
    targetType: v.optional(v.string()),
    targetId: v.optional(v.string()),
    reason: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  }).index('by_createdAt', ['createdAt']),

  // Support: tunable config, keyed like the SQL app_config table.
  appConfig: defineTable({
    key: v.string(),
    value: v.any(),
  }).index('by_key', ['key']),

  // Support: measures the §15 evaluation targets.
  scanEvents: defineTable({
    scannerId: v.optional(v.id('users')),
    ownerId: v.optional(v.id('users')),
    outcome: v.string(), // 'ok' | 'expired' | 'reused' | 'self_scan' | 'not_verified' | 'suspended'
    interactionId: v.optional(v.id('interactions')),
    msToProfile: v.optional(v.number()),
    createdAt: v.number(),
  }).index('by_createdAt', ['createdAt']),
})
