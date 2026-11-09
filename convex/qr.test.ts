/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { expect, test } from 'vitest'
import schema from './schema'
import { api } from './_generated/api'
import type { Id } from './_generated/dataModel'

// SPEC.md §12: QR replay must be rejected 100% of the time. These call the
// real mutations under a fake identity rather than asserting on a database
// policy — Convex has no RLS, so this *is* the authorization test.
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

test('a scanned QR cannot be scanned a second time', async () => {
  const t = convexTest(schema, modules)
  const owner = await makeUser(t, 'Owner', 'id_verified')
  const scannerA = await makeUser(t, 'Scanner A', 'id_verified')
  const scannerB = await makeUser(t, 'Scanner B', 'id_verified')

  const { nonce } = await owner.as.mutation(api.qr.issueQr, {})
  await scannerA.as.mutation(api.qr.scanQr, { nonce })

  await expect(scannerB.as.mutation(api.qr.scanQr, { nonce })).rejects.toThrow()
})

test('an expired QR is rejected', async () => {
  const t = convexTest(schema, modules)
  const owner = await makeUser(t, 'Owner', 'id_verified')
  const scanner = await makeUser(t, 'Scanner', 'id_verified')

  const { nonce } = await owner.as.mutation(api.qr.issueQr, {})
  await t.run(async (ctx) => {
    const token = await ctx.db
      .query('qrTokens')
      .withIndex('by_nonce', (q) => q.eq('nonce', nonce))
      .unique()
    if (token) await ctx.db.patch(token._id, { expiresAt: Date.now() - 1000 })
  })

  await expect(scanner.as.mutation(api.qr.scanQr, { nonce })).rejects.toThrow()
})

test('scanning your own QR is rejected', async () => {
  const t = convexTest(schema, modules)
  const owner = await makeUser(t, 'Owner', 'id_verified')
  const { nonce } = await owner.as.mutation(api.qr.issueQr, {})

  await expect(owner.as.mutation(api.qr.scanQr, { nonce })).rejects.toThrow()
})

test('an unverified user cannot issue a QR', async () => {
  const t = convexTest(schema, modules)
  const user = await makeUser(t, 'Unverified', 'unverified')

  await expect(user.as.mutation(api.qr.issueQr, {})).rejects.toThrow()
})

test('an unverified user cannot scan a QR', async () => {
  const t = convexTest(schema, modules)
  const owner = await makeUser(t, 'Owner', 'id_verified')
  const unverified = await makeUser(t, 'Unverified', 'unverified')

  const { nonce } = await owner.as.mutation(api.qr.issueQr, {})
  await expect(unverified.as.mutation(api.qr.scanQr, { nonce })).rejects.toThrow()
})

test('a confirmed scan opens a usable interaction for both parties', async () => {
  const t = convexTest(schema, modules)
  const owner = await makeUser(t, 'Owner', 'id_verified')
  const scanner = await makeUser(t, 'Scanner', 'id_verified')

  const { nonce } = await owner.as.mutation(api.qr.issueQr, {})
  const { interactionId } = await scanner.as.mutation(api.qr.scanQr, { nonce })

  // A cannot confirm before B has (docs/SPEC.md §6.3 DECISION)
  await expect(owner.as.mutation(api.interactions.confirmMeeting, { interactionId })).rejects.toThrow()

  await scanner.as.mutation(api.interactions.confirmMeeting, { interactionId })
  await owner.as.mutation(api.interactions.confirmMeeting, { interactionId })

  const result = await owner.as.query(api.interactions.getInteraction, { interactionId })
  expect(result?.interaction.status).toBe('confirmed')
})
