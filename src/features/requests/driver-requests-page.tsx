import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { Link } from 'react-router-dom'
import { ArrowLeft, MapPin, Moon, ShieldAlert, Users } from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import { cn } from '@/lib/utils'
import { RideNavigationCard } from './ride-navigation'
import { notify } from '@/lib/notify'

const SIM_STEP_MS = 1200
const SIM_STEP = 0.08

function isNightHour(hour: number) {
  return hour >= 22 || hour < 5
}

export function DriverRequestsPage() {
  const me = useQuery(api.profiles.getMe)
  const open = useQuery(api.rideRequests.listOpenForDriver)
  const activeRide = useQuery(api.rideRequests.myActiveRideForDriver)
  const route = useQuery(api.rideRequests.demoRouteCoordinates)
  const steps = useQuery(api.rideRequests.demoRouteSteps)
  const setAvailability = useMutation(api.rideRequests.setAvailability)
  const acceptRequest = useMutation(api.rideRequests.acceptRequest)
  const advanceRouteProgress = useMutation(api.rideRequests.advanceRouteProgress)
  const simulateRouteDeviation = useMutation(api.rideRequests.simulateRouteDeviation)
  const sosAlert = useMutation(api.rideRequests.sosAlert)
  const [accepting, setAccepting] = useState<string | null>(null)
  const [gpsRunning, setGpsRunning] = useState(false)
  const [sosState, setSosState] = useState<'idle' | 'confirm' | 'sent'>('idle')
  const [nowHour, setNowHour] = useState(() => new Date().getHours())
  const gpsTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const notifiedForRide = useRef<string | null>(null)

  const requestId = activeRide?.request?._id
  const progress = activeRide?.request?.routeProgress ?? 0
  const arrived = progress >= 1
  const nightMode = isNightHour(nowHour)
  const progressRef = useRef(progress)
  progressRef.current = progress

  useEffect(() => {
    const id = setInterval(() => setNowHour(new Date().getHours()), 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    return () => {
      if (gpsTimer.current) clearInterval(gpsTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!requestId && gpsTimer.current) {
      clearInterval(gpsTimer.current)
      gpsTimer.current = null
      setGpsRunning(false)
    }
  }, [requestId])

  useEffect(() => {
    if (requestId && activeRide?.passenger && notifiedForRide.current !== requestId) {
      notifiedForRide.current = requestId
      notify('New ride matched', `You're now taking ${activeRide.passenger.displayName}.`)
    }
  }, [requestId, activeRide?.passenger])

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

  function toggleGps() {
    if (!requestId) return
    if (gpsRunning) {
      if (gpsTimer.current) clearInterval(gpsTimer.current)
      gpsTimer.current = null
      setGpsRunning(false)
      return
    }
    setGpsRunning(true)
    gpsTimer.current = setInterval(async () => {
      const next = Math.min(1, progressRef.current + SIM_STEP)
      progressRef.current = next
      await advanceRouteProgress({ requestId, progress: next })
      if (next >= 1 && gpsTimer.current) {
        clearInterval(gpsTimer.current)
        gpsTimer.current = null
        setGpsRunning(false)
      }
    }, SIM_STEP_MS)
  }

  async function deviate() {
    if (!requestId) return
    await simulateRouteDeviation({ requestId })
  }

  async function confirmSos() {
    if (!requestId) return
    await sosAlert({ requestId })
    notify('SOS sent', 'Your SOS alert was logged for review.')
    setSosState('sent')
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

        {activeRide?.request && activeRide.passenger && (
          <div className="flex flex-col gap-3">
            {nightMode && (
              <div className="flex items-center gap-2 rounded-2xl bg-canvas-ink px-4 py-2.5 text-[12px] font-bold text-slate-100">
                <Moon size={14} strokeWidth={2.4} />
                Night ride mode active for this trip.
              </div>
            )}

            <div className="neu-out-sm flex items-center gap-3 rounded-2xl p-3.5">
              <div className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-full bg-mist">
                {activeRide.passenger.photoUrl && (
                  <img src={activeRide.passenger.photoUrl} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-bold text-ink">{activeRide.passenger.displayName}</div>
                <div className="text-[11.5px] text-slate">Active ride — scan their QR when you meet</div>
              </div>
            </div>

            {route && steps && (
              <RideNavigationCard
                route={route}
                steps={steps}
                progress={progress}
                gpsRunning={gpsRunning}
                arrived={arrived}
                onToggleGps={toggleGps}
                nightMode={nightMode}
                deviationActive={!!activeRide.request.routeDeviationAt}
                onSimulateDeviation={deviate}
              />
            )}

            <div className="neu-out-sm rounded-2xl p-3">
              {sosState === 'idle' && (
                <button
                  type="button"
                  onClick={() => setSosState('confirm')}
                  className="tap-feedback flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-red-50 text-[12.5px] font-bold text-danger"
                >
                  <ShieldAlert size={14} strokeWidth={2.4} />
                  SOS — I need help
                </button>
              )}
              {sosState === 'confirm' && (
                <div className="flex flex-col gap-2">
                  <p className="text-[12px] text-ink">
                    This flags your ride for review and logs an incident report. Send it?
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={confirmSos}
                      className="tap-feedback flex-1 rounded-xl bg-danger py-2 text-[12.5px] font-bold text-white"
                    >
                      Yes, send SOS
                    </button>
                    <button
                      type="button"
                      onClick={() => setSosState('idle')}
                      className="tap-feedback flex-1 rounded-xl border border-mist py-2 text-[12.5px] font-bold text-slate"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              {sosState === 'sent' && (
                <div className="text-center text-[12.5px] font-semibold text-danger">
                  SOS sent — logged for review. This is a demo and does not call 911.
                </div>
              )}
            </div>
          </div>
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
