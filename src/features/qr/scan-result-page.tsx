import { useMutation, useQuery } from 'convex/react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

export function ScanResultPage() {
  const { id } = useParams<{ id: string }>()
  const interactionId = id as Id<'interactions'>
  const data = useQuery(api.interactions.getInteraction, { interactionId })
  const confirmMeeting = useMutation(api.interactions.confirmMeeting)
  const cancelInteraction = useMutation(api.interactions.cancelInteraction)
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()

  if (data === undefined) {
    return <div className="flex min-h-dvh items-center justify-center bg-ink text-slate-400">Loading…</div>
  }
  if (data === null || !data.other) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-ink p-8 text-center text-white">
        <div className="text-[15px] font-bold">This meeting isn&apos;t available anymore.</div>
        <Link to="/home" className="font-mono text-[12px] font-bold text-brand">
          HOME →
        </Link>
      </div>
    )
  }

  const { interaction, other, myRole } = data
  const status = interaction.status

  return (
    <div className="flex min-h-dvh flex-col bg-ink text-white">
      <div className="flex items-center justify-between px-6 py-5">
        <Link to="/home" className="font-mono text-[11px] font-bold tracking-wide text-slate-400">
          ← HOME
        </Link>
        <div className="font-mono text-[11px] font-bold tracking-widest text-slate-400">MATCH FOUND</div>
      </div>

      <div className="flex flex-1 flex-col items-center gap-4 px-6 pb-8">
        {/* Photo first — the one non-negotiable layout rule (SPEC.md §3.4) */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="h-[220px] w-[220px] overflow-hidden rounded-3xl bg-slate-700"
        >
          {other.photoUrl && <img src={other.photoUrl} alt="" className="h-full w-full object-cover" />}
        </motion.div>

        <div className="text-center">
          <div className="text-[22px] font-extrabold">{other.displayName}</div>
          <div className="mt-0.5 text-[13px] text-slate-400 capitalize">{other.rideRole}</div>
        </div>

        <div className="flex gap-2 font-mono text-[11px] font-bold">
          <span className="rounded-md bg-green-900/40 px-2 py-1 text-verified">✓ ID-VERIFIED</span>
          <span className="rounded-md bg-slate-800 px-2 py-1 text-slate-300">
            {other.ratingSummary.score ? `★ ${other.ratingSummary.score.toFixed(1)}` : 'NEW'} ·{' '}
            {other.ratingSummary.confirmedMeetings} meetings
          </span>
        </div>

        {status === 'scanned' && myRole === 'B' && !interaction.bConfirmedAt && (
          <>
            <div className="mt-2 rounded-xl bg-slate-800 px-4 py-3 text-center text-[13px] text-slate-300">
              Check the photo matches the person in front of you, then confirm.
            </div>
            <div className="mt-auto flex w-full gap-3 pt-6">
              <button
                onClick={async () => {
                  await cancelInteraction({ interactionId, reason: 'face_mismatch', report: true })
                  navigate('/home')
                }}
                className="flex-1 rounded-full border border-danger py-3.5 text-[14px] font-bold text-danger"
              >
                Not the person
              </button>
              <button
                onClick={async () => {
                  await confirmMeeting({ interactionId })
                }}
                className="flex-[1.3] rounded-full bg-verified py-3.5 text-[14px] font-bold text-white"
              >
                This is the person
              </button>
            </div>
          </>
        )}

        {status === 'scanned' && interaction.bConfirmedAt && (
          <div className="mt-4 rounded-xl bg-slate-800 px-4 py-3 text-center text-[13px] text-slate-300">
            Waiting for {other.displayName} to confirm on their end…
          </div>
        )}

        <AnimatePresence>
          {status === 'confirmed' && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, scale: 0.9, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="mt-4 flex w-full flex-col items-center gap-3 rounded-xl bg-green-900/20 px-4 py-5"
            >
              <div className="font-mono text-[11px] font-bold tracking-widest text-verified">CONFIRMED</div>
              <p className="text-center text-[12.5px] text-slate-300">
                You can both rate each other within the next 48 hours.
              </p>
              <Link
                to={`/rate/${interactionId}`}
                className="w-full rounded-full bg-brand py-3 text-center text-[14px] font-bold text-white"
              >
                Rate now
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {(status === 'cancelled' || status === 'expired') && (
          <div className="mt-4 text-center text-[13px] text-slate-400">
            This meeting was {status === 'cancelled' ? 'cancelled' : 'not confirmed in time'}.
          </div>
        )}
      </div>
    </div>
  )
}
