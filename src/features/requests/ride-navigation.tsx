import { useRef } from 'react'
import {
  Navigation2,
  AlertTriangle,
  Moon,
  Pause,
  Play,
  ArrowUp,
  CornerUpLeft,
  CornerUpRight,
  Flag,
  LocateFixed,
  TriangleAlert,
  Maximize,
} from 'lucide-react'
import { Map, MapRoute, RouteProgress, RouteMarker, MarkerContent, type MapRef } from '@/components/ui/map'
import { stepIndexForProgress, ILOILO_DEMO_STEPS } from '../../../convex/lib/iloiloRoute'
import { cn } from '@/lib/utils'

type Step = (typeof ILOILO_DEMO_STEPS)[number]

function remainingMeters(steps: Step[], stepIndex: number) {
  return steps.slice(stepIndex).reduce((sum, s) => sum + s.distanceM, 0)
}

function distanceLabel(meters: number) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`
}

function turnDirection(instruction: string): 'left' | 'right' | 'arrive' | 'straight' {
  const lower = instruction.toLowerCase()
  if (lower.includes('arrive')) return 'arrive'
  if (lower.includes('left')) return 'left'
  if (lower.includes('right')) return 'right'
  return 'straight'
}

function TurnIcon({ direction, size }: { direction: ReturnType<typeof turnDirection>; size: number }) {
  if (direction === 'left') return <CornerUpLeft size={size} strokeWidth={2.6} />
  if (direction === 'right') return <CornerUpRight size={size} strokeWidth={2.6} />
  if (direction === 'arrive') return <Flag size={size} strokeWidth={2.6} />
  return <ArrowUp size={size} strokeWidth={2.6} />
}

// RideNavigationCard: a Grab/Maxim-style turn-by-turn navigator — a big
// top instruction banner (direction icon + distance + street), a near
// full-bleed map below it with floating
// recenter/report controls, and a bottom bar with the remaining
// time/distance, arrival clock, and the demo's start/pause control.
// Shared by the passenger (request-ride-page.tsx) and driver
// (driver-requests-page.tsx) apps, and the public share page in read-only
// form. Everything here is demo data — a fixed Iloilo City route and a
// fixed instruction list (convex/lib/iloiloRoute.ts) advanced by
// `progress`, never a real routing/directions API. See docs/DECISIONS.md.
export function RideNavigationCard({
  route,
  steps,
  progress,
  gpsRunning,
  arrived,
  onToggleGps,
  etaMinutes,
  nightMode = false,
  deviationActive = false,
  onSimulateDeviation,
  readOnly = false,
}: {
  route: [number, number][]
  steps: Step[]
  progress: number
  gpsRunning: boolean
  arrived: boolean
  onToggleGps?: () => void
  etaMinutes?: number
  nightMode?: boolean
  deviationActive?: boolean
  onSimulateDeviation?: () => void
  readOnly?: boolean
}) {
  const mapRef = useRef<MapRef | null>(null)
  const stepIndex = stepIndexForProgress(progress)
  const currentStep = steps[stepIndex]
  const direction = currentStep ? turnDirection(currentStep.instruction) : 'straight'
  const routeColor = deviationActive ? '#ef4444' : '#2563eb'
  const remaining = remainingMeters(steps, stepIndex)
  const remainingMin = etaMinutes !== undefined ? Math.max(1, Math.round(etaMinutes * (1 - progress))) : undefined
  const arrivalClock =
    remainingMin !== undefined
      ? new Date(Date.now() + remainingMin * 60_000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      : undefined
  const currentPoint = route.length ? route[Math.min(route.length - 1, Math.round(progress * (route.length - 1)))] : null

  function recenter() {
    if (!mapRef.current || !currentPoint) return
    mapRef.current.flyTo({ center: currentPoint, zoom: 15, duration: 600 })
  }

  function fitOverview() {
    if (!mapRef.current || route.length < 2) return
    const lngs = route.map((p) => p[0])
    const lats = route.map((p) => p[1])
    mapRef.current.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 32, duration: 600 },
    )
  }

  return (
    <div className={cn('overflow-hidden rounded-[22px]', nightMode ? 'neu-dark-out-sm' : 'neu-out-sm')}>
      {/* Big top instruction banner — the "490 m / Upper Cross St" block
          from the reference screenshot. Always rendered against a fixed
          dark surface (not --color-ink), same as the rest of this
          always-dark navigation chrome. */}
      {!arrived && currentStep ? (
        <div className={cn('flex items-center gap-3 px-4 py-3.5', deviationActive ? 'bg-danger' : 'bg-canvas-ink')}>
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white text-ink">
            <TurnIcon direction={direction} size={22} />
          </div>
          <div className="min-w-0 flex-1 text-white">
            <div className="text-[22px] font-extrabold leading-tight">
              {currentStep.distanceM > 0 ? distanceLabel(currentStep.distanceM) : 'Now'}
            </div>
            <div className="truncate text-[13px] font-semibold text-slate-200">{currentStep.instruction}</div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-verified px-4 py-3.5 text-white">
          <Flag size={20} strokeWidth={2.4} />
          <div className="text-[15px] font-extrabold">You&apos;ve arrived</div>
        </div>
      )}

      {route.length > 1 && (
        <div className="relative mx-3 mt-2 h-64 overflow-hidden rounded-[18px]">
          <Map
            ref={mapRef}
            className="h-full w-full"
            theme="light"
            viewport={{ center: route[Math.floor(route.length / 2)], zoom: 12.5, bearing: 0, pitch: 0 }}
          >
            {/* Casing: a wider pale line under the colored route, the same
                two-layer trick Grab/Google Maps use so the route reads
                clearly against any basemap tile underneath it. */}
            <MapRoute id="casing" coordinates={route} color="#ffffff" width={9} opacity={0.9} />
            <MapRoute coordinates={route} progress={progress} color="#cbd5e1" width={5}>
              <RouteProgress color={routeColor} width={5} />
              <RouteMarker at="progress">
                <MarkerContent>
                  <div className="relative flex h-6 w-6 items-center justify-center">
                    <span
                      className="absolute h-6 w-6 animate-ping rounded-full opacity-40"
                      style={{ backgroundColor: routeColor }}
                    />
                    <span
                      className="relative flex h-4 w-4 items-center justify-center rounded-full border-2 border-white shadow-lg"
                      style={{ backgroundColor: routeColor }}
                    >
                      <Navigation2 size={9} strokeWidth={3} className="text-white" />
                    </span>
                  </div>
                </MarkerContent>
              </RouteMarker>
            </MapRoute>
          </Map>

          {/* Floating right-side controls, like Grab's recenter/report
              column next to the map. */}
          <div className="absolute right-2.5 top-2.5 flex flex-col gap-2">
            <button
              type="button"
              onClick={recenter}
              aria-label="Recenter on current position"
              className="tap-feedback flex h-9 w-9 items-center justify-center rounded-full bg-canvas-ink/90 text-white shadow-lg backdrop-blur-sm"
            >
              <LocateFixed size={16} strokeWidth={2.4} />
            </button>
            <button
              type="button"
              onClick={fitOverview}
              aria-label="View full route"
              className="tap-feedback flex h-9 w-9 items-center justify-center rounded-full bg-canvas-ink/90 text-white shadow-lg backdrop-blur-sm"
            >
              <Maximize size={15} strokeWidth={2.4} />
            </button>
            {!readOnly && onSimulateDeviation && !arrived && (
              <button
                type="button"
                onClick={onSimulateDeviation}
                aria-label="Demo: simulate route deviation"
                className="tap-feedback flex h-9 w-9 items-center justify-center rounded-full bg-canvas-ink/90 text-pending shadow-lg backdrop-blur-sm"
              >
                <TriangleAlert size={16} strokeWidth={2.4} />
              </button>
            )}
          </div>
        </div>
      )}

      {deviationActive && (
        <div className="mx-3 mt-2 flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-[11.5px] font-bold text-danger">
          <AlertTriangle size={13} strokeWidth={2.4} />
          Route deviation detected (demo) — resume navigation to clear it.
        </div>
      )}

      {/* Bottom bar — ETA/distance + arrival clock on the left (like
          "13 min · 7.0 km" / "10:48 am" in the reference), the demo's
          start/pause control on the right. */}
      <div className="flex items-center justify-between gap-2 bg-canvas-ink px-4 py-3">
        <div className="text-white">
          {!arrived ? (
            <>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[16px] font-extrabold">{remainingMin !== undefined ? `${remainingMin} min` : 'Demo'}</span>
                <span className="text-[12px] text-slate-300">· {distanceLabel(remaining)}</span>
              </div>
              {arrivalClock && (
                <div className="text-[10.5px] font-semibold text-brand-dark" style={{ color: '#60a5fa' }}>
                  Arrive ~{arrivalClock}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-300">
              {nightMode && <Moon size={12} strokeWidth={2.4} />}
              Live tracking (demo) — complete
            </div>
          )}
        </div>
        {!readOnly && onToggleGps && (
          <button
            type="button"
            onClick={onToggleGps}
            disabled={arrived}
            className="tap-feedback flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-[12.5px] font-bold text-white disabled:opacity-50"
          >
            {arrived ? null : gpsRunning ? <Pause size={13} strokeWidth={2.6} /> : <Play size={13} strokeWidth={2.6} />}
            {arrived ? 'Arrived' : gpsRunning ? 'Pause' : progress > 0 ? 'Resume' : 'Start navigation'}
          </button>
        )}
      </div>
    </div>
  )
}
