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
    // Driver-only "I'm online" presence. A timestamp, not a boolean, so a
    // driver who closes the app without going offline doesn't stay listed
    // forever — the matching query (rideRequests.ts) treats anything older
    // than AVAILABILITY_TTL_MS as offline, no cron needed.
    availableSince: v.optional(v.number()),
    avatarStorageId: v.optional(v.id('_storage')),
    tier: v.union(v.literal('unverified'), v.literal('id_verified')),
    tierExpiresAt: v.optional(v.number()),
    suspendedAt: v.optional(v.number()),
    consentAt: v.optional(v.number()),
    // Trusted-contact fields (2026-11-23, see docs/DECISIONS.md). Purely a
    // label + number the rider types in themselves — never verified, never
    // auto-dialed by this app. Used only to (a) show on the live-share page
    // who a viewer should call, and (b) prefill the share-link message. No
    // SMS/notification is ever actually sent to this number by the server.
    emergencyContactName: v.optional(v.string()),
    emergencyContactPhone: v.optional(v.string()),
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

  // Support: ride-matching requests (2026-11-22, see docs/DECISIONS.md).
  // Deliberately *not* booking/dispatch in the TNVS sense — this only
  // connects a passenger with an already-verified driver, city-wide across
  // Iloilo. No real fare, no payment, no routing/live GPS: the destination
  // is a free-text note for context, not something this app geocodes or
  // tracks. Once accepted, the two riders still meet and verify through the
  // existing QR handshake (D3/D4) exactly like any other pickup.
  //
  // estimatedFareMinPhp/MaxPhp/estimatedEtaMinutes (2026-11-22, optional so
  // rows created before this field existed stay valid with no migration):
  // a demo-only
  // display estimate, not a quote — generated client-independent on the
  // server from a fixed mock range, with no distance, routing, or location
  // input. Intentionally not a real fare: a real fare/dispatch feature is
  // the TNVS/accreditation line this app stays on the safe side of
  // (docs/DECISIONS.md). UI must always label these "estimate" / "not a
  // quote" so this never reads as real pricing.
  rideRequests: defineTable({
    passengerId: v.id('users'),
    note: v.optional(v.string()),
    status: v.union(
      v.literal('open'),
      v.literal('accepted'),
      v.literal('cancelled'),
      v.literal('expired'),
    ),
    driverId: v.optional(v.id('users')),
    acceptedAt: v.optional(v.number()),
    estimatedFareMinPhp: v.optional(v.number()),
    estimatedFareMaxPhp: v.optional(v.number()),
    estimatedEtaMinutes: v.optional(v.number()),
    // Demo GPS simulation (2026-11-23, see docs/DECISIONS.md). routeProgress
    // is a 0–1 fraction along a FIXED, hardcoded Iloilo City route
    // (convex/lib/iloiloRoute.ts) — there is no real device GPS, geocoding,
    // or routing anywhere in this app. Advanced only by the rider/driver's
    // own "simulate" button, for walkthroughs.
    routeProgress: v.optional(v.number()),
    // Live-share (2026-11-23): a random, unguessable token that makes this
    // ride's (sanitized, read-only) status visible with no login, so a
    // trusted contact can follow along. Rotates to undefined on cancel.
    shareToken: v.optional(v.string()),
    // SOS (2026-11-23): demo-only panic flag. Setting this creates a
    // `reports` row and an auditLog entry — it does NOT call 911/any real
    // emergency service or notify anyone outside this app.
    sosAt: v.optional(v.number()),
    // Set by an admin from the incident dashboard (2026-11-25) once an SOS
    // has been looked at — separate from the underlying `reports` row's own
    // status so "resolved on the live map" and "handled as a report" can be
    // tracked independently.
    sosResolvedAt: v.optional(v.number()),
    // Post-ride safety check-in (2026-11-23): the passenger's own
    // "Yes, I arrived safely" confirmation, separate from the star rating.
    safetyCheckedInAt: v.optional(v.number()),
    // Mid-ride scheduled check-in (2026-11-25): a SEPARATE confirmation from
    // safetyCheckedInAt — this one fires partway through the simulated
    // route, not at arrival. Demo-only: the "schedule" is just "progress
    // crossed 50%", decided client-side, not a real cron/timer.
    midRideCheckInAt: v.optional(v.number()),
    // Route-deviation alert (2026-11-25): demo-only. Either party can flag
    // "pretend the route just went off-path" with simulateRouteDeviation;
    // cleared the next time advanceRouteProgress runs (resuming the route
    // "resolves" it). There is no real GPS to compare against — this never
    // gets set from actual position data.
    routeDeviationAt: v.optional(v.number()),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index('by_passengerId', ['passengerId'])
    .index('by_status', ['status'])
    .index('by_driverId', ['driverId'])
    .index('by_shareToken', ['shareToken']),

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
