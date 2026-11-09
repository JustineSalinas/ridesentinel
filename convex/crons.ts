import { cronJobs } from 'convex/server'
import { internalMutation } from './_generated/server'
import { internal } from './_generated/api'

const CONFIRM_WINDOW_MS = 10 * 60 * 1000

// Convex equivalent of the purge-expired-files Edge Function (SPEC.md §6.5):
// deletes storage files past their 30-day retention and flips stale
// `scanned` interactions to `expired`. Runs on a schedule, not an HTTP
// endpoint, so it needs no shared secret the way the SQL version did.
export const purgeExpiredFiles = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()

    const requests = await ctx.db.query('verificationRequests').take(200)
    for (const req of requests) {
      if (req.filesDeleteAfter && req.filesDeleteAfter < now && !req.filesDeletedAt) {
        if (req.idPhotoStorageId) await ctx.storage.delete(req.idPhotoStorageId)
        if (req.selfieStorageId) await ctx.storage.delete(req.selfieStorageId)
        await ctx.db.patch(req._id, {
          idPhotoStorageId: undefined,
          selfieStorageId: undefined,
          filesDeletedAt: now,
        })
        await ctx.db.insert('auditLog', {
          action: 'files.purge',
          targetType: 'verificationRequests',
          targetId: req._id,
          createdAt: now,
        })
      }
    }

    const interactions = await ctx.db.query('interactions').take(500)
    for (const interaction of interactions) {
      if (interaction.status === 'scanned' && now - interaction.scannedAt > CONFIRM_WINDOW_MS) {
        await ctx.db.patch(interaction._id, { status: 'expired' })
      }
    }
  },
})

const crons = cronJobs()
crons.interval('purge expired files and stale scans', { hours: 1 }, internal.crons.purgeExpiredFiles, {})
export default crons
