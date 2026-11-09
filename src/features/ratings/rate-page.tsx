import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { ConvexError } from 'convex/values'
import { Link, useParams } from 'react-router-dom'
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

  if (data === undefined || mine === undefined) return null
  if (data === null || !data.other) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-ink p-8 text-center text-slate-400">
        Not found.
      </div>
    )
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
    <div className="flex min-h-dvh flex-col bg-ink text-white">
      <div className="flex items-center justify-between px-6 py-5">
        <Link to="/home" className="font-mono text-[11px] font-bold tracking-wide text-slate-400">
          ← HOME
        </Link>
        <div className="font-mono text-[11px] font-bold tracking-widest text-slate-400">RATE</div>
      </div>

      {alreadyRated ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
          <div className="font-mono text-[11px] font-bold tracking-widest text-brand">SUBMITTED</div>
          <h1 className="text-[20px] font-extrabold">Rating recorded</h1>
          <p className="max-w-[260px] text-[13px] text-slate-300">
            Hidden until {data.other.displayName} rates you too, or the window closes.
          </p>
          <Link to="/home" className="mt-2 font-mono text-[12px] font-bold text-brand">
            HOME →
          </Link>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center gap-5 px-8">
          <div className="h-[72px] w-[72px] overflow-hidden rounded-full bg-slate-700">
            {data.other.photoUrl && <img src={data.other.photoUrl} alt="" className="h-full w-full object-cover" />}
          </div>
          <div className="text-center">
            <div className="text-[17px] font-bold">How was your meeting with {data.other.displayName}?</div>
          </div>

          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setStars(n)} aria-label={`${n} stars`}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill={n <= stars ? '#D97706' : 'none'}>
                  <path
                    d="M12 2l2.9 6.3L22 9l-5 5 1.3 7L12 17.8 5.7 21 7 14 2 9l7.1-.7L12 2z"
                    stroke="#D97706"
                    strokeWidth="1"
                  />
                </svg>
              </button>
            ))}
          </div>
          <div className="h-5 font-mono text-[12px] font-bold text-pending">{LABELS[stars]}</div>

          {error && <div className="text-[12.5px] text-danger">{error}</div>}

          <button
            onClick={submit}
            disabled={stars === 0}
            className="mt-2 flex h-[52px] w-full items-center justify-center rounded-full bg-brand text-[15px] font-bold text-white disabled:opacity-40"
          >
            Submit rating
          </button>

          <Link
            to={`/report?interactionId=${id}&reason=fake_or_coerced_rating`}
            className="font-mono text-[11px] font-bold text-danger"
          >
            FLAG THIS INTERACTION
          </Link>
        </div>
      )}
    </div>
  )
}
