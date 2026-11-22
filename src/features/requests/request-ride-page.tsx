import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { ConvexError } from 'convex/values'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, MapPin, X } from 'lucide-react'
import { api } from '../../../convex/_generated/api'

const ERROR_COPY: Record<string, string> = {
  NOT_A_PASSENGER: 'Only passenger accounts can request a ride.',
  NOT_VERIFIED: 'Get ID-verified before requesting a ride.',
  REQUEST_ALREADY_OPEN: "You've already got an open request.",
}

export function RequestRidePage() {
  const me = useQuery(api.profiles.getMe)
  const active = useQuery(api.rideRequests.myActiveRequest)
  const requestRide = useMutation(api.rideRequests.requestRide)
  const cancelRequest = useMutation(api.rideRequests.cancelRequest)

  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (me === undefined || active === undefined) return null

  async function submit() {
    setError(null)
    setSubmitting(true)
    try {
      await requestRide({ note: note || undefined })
    } catch (e) {
      const code = e instanceof ConvexError ? (e.data as string) : undefined
      setError((code && ERROR_COPY[code]) ?? 'Could not send your request. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function cancel() {
    if (!active?.request) return
    await cancelRequest({ requestId: active.request._id })
  }

  return (
    <div className="flex min-h-dvh flex-col bg-page">
      <div className="flex items-center gap-3 px-6 py-5">
        <Link
          to="/home"
          className="tap-feedback flex h-8 w-8 items-center justify-center rounded-full text-slate transition-colors hover:bg-mist hover:text-ink"
          aria-label="Back to home"
        >
          <ArrowLeft size={16} strokeWidth={2.2} />
        </Link>
        <div className="text-[18px] font-extrabold text-ink">Request a ride</div>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-6 pb-8">
        {!active?.request && (
          <>
            <p className="text-[13.5px] leading-snug text-slate">
              This finds an already-verified driver online in Iloilo City — it doesn&apos;t set a fare or
              book anything. You still agree on details with your driver once matched.
            </p>

            {error && <div className="rounded-2xl bg-red-50 px-4 py-3 text-[13px] text-danger">{error}</div>}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="note" className="text-[13px] font-semibold text-[#334155]">
                Where to / note (optional)
              </label>
              <textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 200))}
                placeholder="e.g. Near SM City, around 6pm"
                className="neu-in h-24 resize-none rounded-2xl p-3 text-[13.5px] text-ink placeholder:text-slate outline-none"
              />
            </div>

            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="tap-feedback mt-2 flex h-[52px] items-center justify-center gap-1.5 rounded-xl bg-brand text-[16px] font-bold text-white transition-colors hover:bg-brand-dark disabled:opacity-50 disabled:hover:bg-brand"
            >
              {submitting ? 'Sending…' : 'Find a ride'}
              {!submitting && <ArrowRight size={17} strokeWidth={2.4} />}
            </button>
          </>
        )}

        {active?.request && active.request.status === 'open' && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <div className="neu-out flex h-16 w-16 items-center justify-center rounded-full text-brand">
              <MapPin size={24} strokeWidth={2} />
            </div>
            <div className="text-[17px] font-bold text-ink">Looking for a driver…</div>
            <p className="max-w-[260px] text-[13px] leading-snug text-slate">
              Verified drivers online anywhere in Iloilo City can see your request. This expires after 15
              minutes if no one accepts.
            </p>
            <button
              type="button"
              onClick={cancel}
              className="tap-feedback mt-2 inline-flex items-center gap-1 text-[13px] font-bold text-danger"
            >
              <X size={14} strokeWidth={2.5} />
              Cancel request
            </button>
          </div>
        )}

        {active?.request && active.request.status === 'accepted' && active.driver && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <div className="neu-out h-20 w-20 overflow-hidden rounded-full bg-mist">
              {active.driver.photoUrl && (
                <img src={active.driver.photoUrl} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div>
              <div className="text-[18px] font-extrabold text-ink">{active.driver.displayName}</div>
              <div className="mt-0.5 text-[13px] text-slate">is on the way</div>
            </div>
            <p className="max-w-[260px] text-[13px] leading-snug text-slate">
              When they arrive, scan their QR to confirm it&apos;s really them before you get on.
            </p>
            <Link
              to="/scan"
              className="tap-feedback mt-2 flex h-[52px] w-full max-w-[260px] items-center justify-center gap-1.5 rounded-xl bg-brand text-[15px] font-bold text-white transition-colors hover:bg-brand-dark"
            >
              Scan their QR
              <ArrowRight size={16} strokeWidth={2.4} />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
