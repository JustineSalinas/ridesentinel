import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { ConvexError } from 'convex/values'
import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft, ArrowRight, MapPin, Moon, ShieldCheck, ShieldAlert, Share2, Sparkles, X } from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import { RideNavigationCard } from './ride-navigation'
import { notify } from '@/lib/notify'

const ERROR_COPY: Record<string, string> = {
  NOT_A_PASSENGER: 'Only passenger accounts can request a ride.',
  NOT_VERIFIED: 'Get ID-verified before requesting a ride.',
  REQUEST_ALREADY_OPEN: "You've already got an open request.",
  DEMO_NO_DRIVER: 'No verified driver account exists yet to simulate with.',
  NOT_ACCEPTED: 'This ride is no longer active.',
}

// SIM_STEP_MS/SIM_STEP: purely a demo pacing choice for the "simulate GPS
// tracking" button — not a real location update interval.
const SIM_STEP_MS = 1200
const SIM_STEP = 0.08
const MID_RIDE_CHECKIN_THRESHOLD = 0.5

function isNightHour(hour: number) {
  return hour >= 22 || hour < 5
}

export function RequestRidePage() {
  const me = useQuery(api.profiles.getMe)
  const active = useQuery(api.rideRequests.myActiveRequest)
  const route = useQuery(api.rideRequests.demoRouteCoordinates)
  const steps = useQuery(api.rideRequests.demoRouteSteps)
  const requestRide = useMutation(api.rideRequests.requestRide)
  const cancelRequest = useMutation(api.rideRequests.cancelRequest)
  const simulateAccept = useMutation(api.rideRequests.simulateAcceptRequest)
  const advanceRouteProgress = useMutation(api.rideRequests.advanceRouteProgress)
  const simulateRouteDeviation = useMutation(api.rideRequests.simulateRouteDeviation)
  const generateShareLink = useMutation(api.rideRequests.generateShareLink)
  const sosAlert = useMutation(api.rideRequests.sosAlert)
  const checkInSafe = useMutation(api.rideRequests.checkInSafe)
  const midRideCheckIn = useMutation(api.rideRequests.midRideCheckIn)

  const location = useLocation()
  const [note, setNote] = useState(() => (location.state as { note?: string } | null)?.note ?? '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [simulating, setSimulating] = useState(false)
  const [gpsRunning, setGpsRunning] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [sosState, setSosState] = useState<'idle' | 'confirm' | 'sent'>('idle')
  const [nowHour, setNowHour] = useState(() => new Date().getHours())
  const gpsTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const wasAccepted = useRef(false)
  const autoSharedForNight = useRef(false)

  const requestId = active?.request?._id
  const progress = active?.request?.routeProgress ?? 0
  const progressRef = useRef(progress)
  progressRef.current = progress
  const nightMode = isNightHour(nowHour)

  useEffect(() => {
    const id = setInterval(() => setNowHour(new Date().getHours()), 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    return () => {
      if (gpsTimer.current) clearInterval(gpsTimer.current)
    }
  }, [])

  // Stop the local ticking the moment the request stops being accepted
  // (cancelled elsewhere, etc.) so it never keeps calling the mutation.
  useEffect(() => {
    if (active?.request?.status !== 'accepted' && gpsTimer.current) {
      clearInterval(gpsTimer.current)
      gpsTimer.current = null
      setGpsRunning(false)
    }
  }, [active?.request?.status])

  // Notify (demo push) the moment a request flips open -> accepted.
  useEffect(() => {
    const accepted = active?.request?.status === 'accepted'
    if (accepted && !wasAccepted.current && active?.driver) {
      notify('Driver matched!', `${active.driver.displayName} accepted your ride request.`)
    }
    wasAccepted.current = accepted
  }, [active?.request?.status, active?.driver])

  // Night ride mode auto-shares the live link once, so a trusted contact is
  // already watching without the rider having to remember to tap it.
  useEffect(() => {
    if (nightMode && requestId && active?.request?.status === 'accepted' && !autoSharedForNight.current) {
      autoSharedForNight.current = true
      generateShareLink({ requestId }).then((token) => {
        setShareUrl(`${window.location.origin}/share/${token}`)
      })
    }
  }, [nightMode, requestId, active?.request?.status, generateShareLink])

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

  async function simulate() {
    if (!active?.request) return
    setError(null)
    setSimulating(true)
    try {
      await simulateAccept({ requestId: active.request._id })
    } catch (e) {
      const code = e instanceof ConvexError ? (e.data as string) : undefined
      setError((code && ERROR_COPY[code]) ?? 'Could not simulate a match. Try again.')
    } finally {
      setSimulating(false)
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

  async function share() {
    if (!requestId) return
    const token = await generateShareLink({ requestId })
    setShareUrl(`${window.location.origin}/share/${token}`)
  }

  async function confirmSos() {
    if (!requestId) return
    await sosAlert({ requestId })
    notify('SOS sent', 'Your SOS alert was logged for review.')
    setSosState('sent')
  }

  async function checkIn() {
    if (!requestId) return
    await checkInSafe({ requestId })
  }

  async function midCheckIn() {
    if (!requestId) return
    await midRideCheckIn({ requestId })
  }

  const arrived = progress >= 1
  const checkedIn = !!active?.request?.safetyCheckedInAt
  const midCheckedIn = !!active?.request?.midRideCheckInAt
  const showMidRidePrompt = progress >= MID_RIDE_CHECKIN_THRESHOLD && !arrived && !midCheckedIn

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-page">
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
              This finds an already-verified driver online in Iloilo City. You&apos;ll see a rough fare
              estimate once matched — it&apos;s a ballpark, not a quote. You still agree on the actual fare
              and details with your driver in person.
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
            <div className="relative flex h-16 w-16 items-center justify-center">
              <span className="absolute h-16 w-16 animate-ping rounded-full bg-brand/20" />
              <span className="absolute h-16 w-16 animate-pulse rounded-full bg-brand/10" />
              <div className="neu-out relative flex h-16 w-16 items-center justify-center rounded-full text-brand">
                <MapPin size={24} strokeWidth={2} className="animate-bounce" />
              </div>
            </div>
            <div className="flex items-center gap-1 text-[17px] font-bold text-ink">
              Looking for a driver
              <span className="flex gap-0.5">
                <span className="h-1 w-1 animate-bounce rounded-full bg-ink [animation-delay:-0.3s]" />
                <span className="h-1 w-1 animate-bounce rounded-full bg-ink [animation-delay:-0.15s]" />
                <span className="h-1 w-1 animate-bounce rounded-full bg-ink" />
              </span>
            </div>
            <p className="max-w-[260px] text-[13px] leading-snug text-slate">
              Verified drivers online anywhere in Iloilo City can see your request. This expires after 15
              minutes if no one accepts.
            </p>
            {active.request.estimatedFareMinPhp !== undefined && (
              <div className="neu-in rounded-xl px-4 py-2.5 text-[12.5px] font-semibold text-slate">
                Est. fare ₱{active.request.estimatedFareMinPhp}–{active.request.estimatedFareMaxPhp}{' '}
                <span className="font-normal text-slate/80">(ballpark, not a quote)</span>
              </div>
            )}

            {error && <div className="rounded-2xl bg-red-50 px-4 py-3 text-[13px] text-danger">{error}</div>}

            <button
              type="button"
              onClick={cancel}
              className="tap-feedback mt-2 inline-flex items-center gap-1 text-[13px] font-bold text-danger"
            >
              <X size={14} strokeWidth={2.5} />
              Cancel request
            </button>

            <div className="mt-4 w-full max-w-[280px] border-t border-mist pt-4">
              <button
                type="button"
                onClick={simulate}
                disabled={simulating}
                className="tap-feedback flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-mist text-[12.5px] font-bold text-slate transition-colors hover:bg-mist/40 disabled:opacity-50"
              >
                <Sparkles size={14} strokeWidth={2.4} />
                {simulating ? 'Simulating…' : 'Demo: simulate a driver accepting'}
              </button>
              <p className="mt-1.5 text-[11px] text-slate/80">
                For walkthroughs only — matches instantly with a real verified driver account instead of
                waiting for one to accept live.
              </p>
            </div>
          </div>
        )}

        {active?.request && active.request.status === 'accepted' && active.driver && (
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto pb-4">
            {nightMode && (
              <div className="flex items-center gap-2 rounded-2xl bg-canvas-ink px-4 py-2.5 text-[12px] font-bold text-slate-100">
                <Moon size={14} strokeWidth={2.4} />
                Night ride mode — your live status is auto-shared and SOS is one tap away.
              </div>
            )}

            <div className="flex flex-col items-center gap-3 pt-2 text-center">
              <div className="neu-out h-20 w-20 overflow-hidden rounded-full bg-mist">
                {active.driver.photoUrl && (
                  <img src={active.driver.photoUrl} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div>
                <div className="flex items-center justify-center gap-1.5 text-[18px] font-extrabold text-ink">
                  {active.driver.displayName}
                  {active.driver.verified && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-verified/10 px-2 py-0.5 text-[10.5px] font-bold text-verified">
                      <ShieldCheck size={11} strokeWidth={2.6} />
                      Verified
                    </span>
                  )}
                </div>
                {active.request.estimatedEtaMinutes !== undefined && (
                  <div className="mt-0.5 text-[13px] text-slate">
                    ~{active.request.estimatedEtaMinutes} min away
                  </div>
                )}
              </div>
              {active.request.estimatedFareMinPhp !== undefined && (
                <div className="neu-in rounded-xl px-4 py-2.5 text-[12.5px] font-semibold text-slate">
                  Est. fare ₱{active.request.estimatedFareMinPhp}–{active.request.estimatedFareMaxPhp}{' '}
                  <span className="font-normal text-slate/80">(ballpark, not a quote)</span>
                </div>
              )}
            </div>

            {error && <div className="rounded-2xl bg-red-50 px-4 py-3 text-[13px] text-danger">{error}</div>}

            {route && steps && (
              <RideNavigationCard
                route={route}
                steps={steps}
                progress={progress}
                gpsRunning={gpsRunning}
                arrived={arrived}
                onToggleGps={toggleGps}
                etaMinutes={active.request.estimatedEtaMinutes}
                nightMode={nightMode}
                deviationActive={!!active.request.routeDeviationAt}
                onSimulateDeviation={deviate}
              />
            )}

            {/* Scheduled mid-ride check-in */}
            {showMidRidePrompt && (
              <div className="neu-out-sm rounded-2xl p-3 text-center">
                <div className="mb-2 text-[12.5px] font-bold text-ink">Still doing okay?</div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={midCheckIn}
                    className="tap-feedback flex-1 rounded-xl bg-verified py-2 text-[12.5px] font-bold text-white"
                  >
                    Yes, I&apos;m okay
                  </button>
                  <button
                    type="button"
                    onClick={() => setSosState('confirm')}
                    className="tap-feedback flex-1 rounded-xl border border-danger py-2 text-[12.5px] font-bold text-danger"
                  >
                    I need help
                  </button>
                </div>
              </div>
            )}

            {/* Live-share with a trusted contact */}
            <div className="neu-out-sm rounded-2xl p-3">
              <button
                type="button"
                onClick={share}
                className="tap-feedback flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-mist text-[12.5px] font-bold text-ink transition-colors hover:bg-mist/40"
              >
                <Share2 size={14} strokeWidth={2.4} />
                Share live status with a trusted contact
              </button>
              {shareUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    readOnly
                    value={shareUrl}
                    className="neu-in flex-1 truncate rounded-lg px-2.5 py-2 text-[11px] text-slate outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(shareUrl)}
                    className="tap-feedback rounded-lg bg-mist px-2.5 py-2 text-[11px] font-bold text-ink"
                  >
                    Copy
                  </button>
                </div>
              )}
              <p className="mt-1.5 text-[10.5px] text-slate/80">
                Anyone with this link sees your ride&apos;s status and simulated location — no login, no
                phone number shown.
              </p>
            </div>

            {/* SOS */}
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

            {/* Post-ride safety check-in */}
            {arrived && !checkedIn && (
              <div className="neu-out-sm rounded-2xl p-3 text-center">
                <div className="mb-2 text-[12.5px] font-bold text-ink">Did you arrive safely?</div>
                <button
                  type="button"
                  onClick={checkIn}
                  className="tap-feedback flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-verified text-[12.5px] font-bold text-white"
                >
                  Yes, I&apos;m safe
                </button>
              </div>
            )}
            {checkedIn && (
              <div className="rounded-2xl bg-verified/10 px-4 py-2.5 text-center text-[12.5px] font-bold text-verified">
                Checked in safe ✓
              </div>
            )}

            <p className="text-center text-[13px] leading-snug text-slate">
              When they arrive, scan their QR to confirm it&apos;s really them before you get on.
            </p>
            <Link
              to="/scan"
              className="tap-feedback flex h-[52px] w-full items-center justify-center gap-1.5 rounded-xl bg-brand text-[15px] font-bold text-white transition-colors hover:bg-brand-dark"
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
