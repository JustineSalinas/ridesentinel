import type { QueryCtx } from '../_generated/server'
import type { Id } from '../_generated/dataModel'

/** A rating is revealed once both sides have rated, or the 48h window closed (SPEC.md §4.4). */
async function isRevealed(ctx: QueryCtx, interactionId: Id<'interactions'>): Promise<boolean> {
  const interaction = await ctx.db.get(interactionId)
  if (!interaction) return false
  if (interaction.ratingWindowEndsAt !== undefined && Date.now() >= interaction.ratingWindowEndsAt) return true
  const pair = await ctx.db
    .query('ratings')
    .withIndex('by_interaction_rater', (q) => q.eq('interactionId', interactionId))
    .take(2)
  return pair.length >= 2
}

/** Public rating summary for a user: null score below 3 distinct raters, else the average (SPEC.md §4.4). */
export async function getRatingSummary(ctx: QueryCtx, userId: Id<'users'>) {
  const [asA, asB, received] = await Promise.all([
    ctx.db.query('interactions').withIndex('by_userA', (q) => q.eq('userA', userId)).take(200),
    ctx.db.query('interactions').withIndex('by_userB', (q) => q.eq('userB', userId)).take(200),
    ctx.db.query('ratings').withIndex('by_ratedId', (q) => q.eq('ratedId', userId)).take(200),
  ])
  const confirmedMeetings =
    asA.filter((i) => i.status === 'confirmed').length + asB.filter((i) => i.status === 'confirmed').length

  const stars: number[] = []
  const raterIds = new Set<Id<'users'>>()
  for (const r of received) {
    if (!r.counted || r.removedAt) continue
    if (!(await isRevealed(ctx, r.interactionId))) continue
    stars.push(r.stars)
    raterIds.add(r.raterId)
  }

  const score = raterIds.size >= 3 ? stars.reduce((a, b) => a + b, 0) / stars.length : null
  return { score, count: raterIds.size, confirmedMeetings }
}
