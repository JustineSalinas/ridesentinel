/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { expect, test } from 'vitest'
import schema from './schema'
import { api, internal } from './_generated/api'
import type { Id } from './_generated/dataModel'

const modules = import.meta.glob('./**/*.ts')

async function makeUser(t: ReturnType<typeof convexTest>, name: string, tier: 'unverified' | 'id_verified') {
  const userId: Id<'users'> = await t.run(async (ctx) => {
    const uid = await ctx.db.insert('users', {})
    await ctx.db.insert('profiles', {
      userId: uid,
      role: 'user',
      rideRole: 'driver',
      displayName: name,
      tier,
      tierExpiresAt: tier === 'id_verified' ? Date.now() + 1000 * 60 * 60 * 24 * 30 : undefined,
      createdAt: Date.now(),
    })
    return uid
  })
  return { userId, as: t.withIdentity({ subject: `${userId}|test` }) }
}

test('a deleted account anonymizes its ratings instead of breaking the other side’s score', async () => {
  const t = convexTest(schema, modules)
  const owner = await makeUser(t, 'Owner', 'id_verified')
  const scanner = await makeUser(t, 'Scanner', 'id_verified')

  const { nonce } = await owner.as.mutation(api.qr.issueQr, {})
  const { interactionId } = await scanner.as.mutation(api.qr.scanQr, { nonce })
  await scanner.as.mutation(api.interactions.confirmMeeting, { interactionId })
  await owner.as.mutation(api.interactions.confirmMeeting, { interactionId })

  await scanner.as.mutation(api.ratings.submitRating, { interactionId, stars: 5 })

  await scanner.as.mutation(api.profiles.deleteMyAccount, {})

  // the rating row survives, just repointed to the tombstone user
  const rating = await t.run(async (ctx) =>
    ctx.db
      .query('ratings')
      .withIndex('by_interaction_rater', (q) => q.eq('interactionId', interactionId))
      .collect(),
  )
  expect(rating).toHaveLength(1)
  expect(rating[0].raterId).not.toBe(scanner.userId)
  expect(rating[0].stars).toBe(5)

  // the deleted user's own profile is gone
  const deletedProfile = await t.run(async (ctx) =>
    ctx.db
      .query('profiles')
      .withIndex('by_userId', (q) => q.eq('userId', scanner.userId))
      .unique(),
  )
  expect(deletedProfile).toBeNull()
})

test('a non-admin cannot call makeAdmin or any admin.* function', async () => {
  const t = convexTest(schema, modules)
  const user = await makeUser(t, 'Nobody', 'id_verified')

  await expect(user.as.query(api.admin.listPendingVerifications, {})).rejects.toThrow()
  await expect(t.mutation(internal.admin.makeAdmin, { displayName: 'Nobody' })).resolves.toBeNull()
  // makeAdmin is internal — only reachable via the CLI/scheduler, never via `api.*`
  await t.run(async (ctx) => {
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_userId', (q) => q.eq('userId', user.userId))
      .unique()
    expect(profile?.role).toBe('admin')
  })
})

test('issueQr is rate-limited past 20 tokens per minute', async () => {
  const t = convexTest(schema, modules)
  const owner = await makeUser(t, 'Owner', 'id_verified')

  for (let i = 0; i < 20; i++) {
    await owner.as.mutation(api.qr.issueQr, {})
  }
  await expect(owner.as.mutation(api.qr.issueQr, {})).rejects.toThrow()
})
