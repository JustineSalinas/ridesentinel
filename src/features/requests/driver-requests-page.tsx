import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { Link } from 'react-router-dom'
import { ArrowLeft, MapPin, Users } from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import { cn } from '@/lib/utils'

export function DriverRequestsPage() {
  const me = useQuery(api.profiles.getMe)
  const open = useQuery(api.rideRequests.listOpenForDriver)
  const setAvailability = useMutation(api.rideRequests.setAvailability)
  const acceptRequest = useMutation(api.rideRequests.acceptRequest)
  const [accepting, setAccepting] = useState<string | null>(null)

  if (me === undefined) return null

  const online = !!me.availableSince && Date.now() - me.availableSince < 15 * 60 * 1000

  async function toggleOnline() {
    await setAvailability({ online: !online })
  }

  async function accept(requestId: string) {
    setAccepting(requestId)
    try {
      await acceptRequest({ requestId: requestId as never })
    } finally {
      setAccepting(null)
    }
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
        <div className="text-[18px] font-extrabold text-ink">Ride requests</div>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-6 pb-8">
        {!me.verified ? (
          <div className="rounded-2xl bg-amber-50 px-4 py-3 text-[13px] font-semibold text-pending">
            Get ID-verified to go online and accept requests.
          </div>
        ) : (
          <button
            type="button"
            onClick={toggleOnline}
            className={cn(
              'tap-feedback flex h-[52px] items-center justify-center gap-2 rounded-xl text-[15px] font-bold transition-colors',
              online ? 'bg-verified text-white hover:bg-green-700' : 'neu-out text-ink',
            )}
          >
            <span className={cn('h-2.5 w-2.5 rounded-full', online ? 'bg-white' : 'bg-mist')} />
            {online ? "You're online — tap to go offline" : 'Go online'}
          </button>
        )}

        {online && (
          <div className="flex flex-col gap-3">
            {open === undefined && <div className="text-sm text-slate">Loading…</div>}
            {open?.length === 0 && (
              <div className="flex flex-col items-center gap-3 px-4 pt-12 text-center">
                <div className="neu-out flex h-14 w-14 items-center justify-center rounded-full">
                  <Users size={22} strokeWidth={1.8} className="text-slate" />
                </div>
                <p className="max-w-[240px] text-[13px] leading-snug text-slate">
                  No open requests right now. New ones appear here automatically.
                </p>
              </div>
            )}
            {open?.map(({ request, passenger }) => (
              <div key={request._id} className="neu-out-sm flex items-center gap-3 rounded-2xl p-3.5">
                <div className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-full bg-mist">
                  {passenger.photoUrl && <img src={passenger.photoUrl} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-bold text-ink">{passenger.displayName}</div>
                  <div className="mt-0.5 flex items-center gap-1 text-[11.5px] text-slate">
                    <MapPin size={11} strokeWidth={2.5} />
                    {request.note || 'No details given'}
                  </div>
                  {request.estimatedFareMinPhp !== undefined && (
                    <div className="mt-0.5 text-[11.5px] font-semibold text-slate">
                      Est. ₱{request.estimatedFareMinPhp}–{request.estimatedFareMaxPhp}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => accept(request._id)}
                  disabled={accepting === request._id}
                  className="tap-feedback flex-shrink-0 rounded-full bg-brand px-3.5 py-2 text-[12.5px] font-bold text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
                >
                  {accepting === request._id ? 'Accepting…' : 'Accept'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
