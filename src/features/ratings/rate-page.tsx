import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { ConvexError } from 'convex/values'
import { Link, useParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

const LABELS = ['', 'Poor', 'Okay', 'Good', 'Great', 'Excellent']

export function RatePage() {
  const { interactionId } = useParams<{ interactionId: string }>()
  const id = interactionId as Id<'interactions'>
  const data = useQuery(api.interactions.getInteraction, { interactionId: id })
  const mine = useQuery(api.ratings.getMine, { interactionId: id })
  const submitRating = useMutation(api.ratings.submitRating)

  const [stars, setStars] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const reduceMotion = useReducedMotion()

  if (data === undefined || mine === undefined) return null
  if (data === null || !data.other) {
    return <div className="flex min-h-dvh items-center justify-center bg-page p-8 text-center text-slate">Not found.</div>
  }

  const alreadyRated = !!mine || submitted

  async function submit() {
    if (stars === 0) return
    setError(null)
    try {
      await submitRating({ interactionId: id, stars })
      setSubmitted(true)
    } catch (e) {
      const code = e instanceof ConvexError ? (e.data as string) : undefined
      setError(code === 'WINDOW_CLOSED' ? 'The 48-hour rating window has closed.' : 'Could not submit. Try again.')
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-page">
      <div className="flex items-center justify-between px-6 py-5">
        <Link to="/home" className="text-[13px] font-semibold text-slate">
          ← Home
        </Link>
        <div className="text-[12px] font-bold uppercase tracking-wide text-slate">Rate</div>
      </div>

      {alreadyRated ? (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center"
        >
          <div className="neu-out flex h-16 w-16 items-center justify-center rounded-full">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 13l4 4L19 7" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-[20px] font-extrabold text-ink">Rating submitted</h1>
          <p className="max-w-[260px] text-[13px] text-slate">
            Hidden until {data.other.displayName} rates you too, or the window closes.
          </p>
          <Link to="/home" className="mt-2 text-[13px] font-bold text-brand">
            Back to home
          </Link>
        </motion.div>
      ) : (
        <div className="flex flex-1 flex-col items-center gap-5 px-8">
          <div className="neu-out h-[84px] w-[84px] overflow-hidden rounded-full bg-mist p-1.5">
            {data.other.photoUrl && <img src={data.other.photoUrl} alt="" className="h-full w-full rounded-full object-cover" />}
          </div>
          <div className="text-center">
            <div className="text-[17px] font-bold text-ink">
              How was your meeting with {data.other.displayName}?
            </div>
          </div>

          <div className="neu-out-sm flex gap-2 rounded-2xl px-4 py-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <motion.button
                key={n}
                onClick={() => setStars(n)}
                aria-label={`${n} stars`}
                animate={!reduceMotion && n === stars ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill={n <= stars ? '#D97706' : 'none'}>
                  <path
                    d="M12 2l2.9 6.3L22 9l-5 5 1.3 7L12 17.8 5.7 21 7 14 2 9l7.1-.7L12 2z"
                    stroke="#D97706"
                    strokeWidth="1"
                  />
                </svg>
              </motion.button>
            ))}
          </div>
          <motion.div
            key={stars}
            initial={reduceMotion ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="h-5 text-[13px] font-bold text-pending"
          >
            {LABELS[stars]}
          </motion.div>

          <div className="w-full rounded-xl bg-blue-50 px-4 py-3 text-center text-[12.5px] text-brand-dark">
            Ratings stay hidden until you both rate each other.
          </div>

          {error && <div className="text-[12.5px] text-danger">{error}</div>}

          <button
            onClick={submit}
            disabled={stars === 0}
            className="mt-1 flex h-[52px] w-full items-center justify-center rounded-xl bg-brand text-[16px] font-bold text-white disabled:opacity-60"
          >
            Submit rating
          </button>

          <Link
            to={`/report?interactionId=${id}&reason=fake_or_coerced_rating`}
            className="text-[12px] font-semibold text-danger"
          >
            Flag this interaction
          </Link>
        </div>
      )}
    </div>
  )
}
