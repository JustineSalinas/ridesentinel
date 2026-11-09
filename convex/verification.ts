import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireProfile } from './lib/authz'

// generateUploadUrl: the client POSTs the compressed image blob directly to
// this URL and gets back a storageId — the file bytes never pass through a
// query/mutation arg (SPEC.md §5 storage rules).
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireProfile(ctx)
    return await ctx.storage.generateUploadUrl()
  },
})

export const submit = mutation({
  args: {
    idType: v.string(),
    idPhotoStorageId: v.id('_storage'),
    selfieStorageId: v.id('_storage'),
  },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx)

    const pending = await ctx.db
      .query('verificationRequests')
      .withIndex('by_userId', (q) => q.eq('userId', profile.userId))
      .filter((q) => q.eq(q.field('status'), 'pending'))
      .first()
    if (pending) throw new Error('ALREADY_PENDING')

    await ctx.db.insert('verificationRequests', {
      userId: profile.userId,
      idType: args.idType,
      idPhotoStorageId: args.idPhotoStorageId,
      selfieStorageId: args.selfieStorageId,
      status: 'pending',
      createdAt: Date.now(),
    })
  },
})

// getMine: caller's own most recent request only — never another user's.
export const getMine = query({
  args: {},
  handler: async (ctx) => {
    const profile = await requireProfile(ctx)
    return await ctx.db
      .query('verificationRequests')
      .withIndex('by_userId', (q) => q.eq('userId', profile.userId))
      .order('desc')
      .first()
  },
})
