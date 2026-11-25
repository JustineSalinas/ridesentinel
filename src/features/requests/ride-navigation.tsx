import { Navigation2, AlertTriangle, Moon, Pause, Play } from 'lucide-react'
import { Map, MapRoute, RouteProgress, RouteMarker, MarkerContent } from '@/components/ui/map'
import { stepIndexForProgress, ILOILO_DEMO_STEPS } from '../../../convex/lib/iloiloRoute'
import { cn } from '@/lib/utils'

type Step = (typeof ILOILO_DEMO_STEPS)[number]

function remainingDistanceLabel(steps: Step[], stepIndex: number) {
  const meters = steps.slice(stepIndex).reduce((sum, s) => sum + s.distanceM, 0)
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`
}

// RideNavigationCard: a Grab/Maxim-style turn-by-turn screen — a near
// full-bleed map with a floating distance/ETA pill and turn banner
// overlaid on top of it, same visual language as those apps' routing
// screen. Shared by the passenger (request-ride-page.tsx) and driver
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
  const stepIndex = stepIndexForProgress(progress)
  const currentStep = steps[stepIndex]
  const nextStep = steps[stepIndex + 1]
  const routeColor = deviationActive ? '#ef4444' : '#2563eb'

  return (
    <div className={cn('overflow-hidden rounded-[22px]', nightMode ? 'neu-dark-out-sm' : 'neu-out-sm')}>
      <div className="flex items-center justify-between px-3.5 pt-3">
        <div className={cn('flex items-center gap-1.5 text-[12px] font-bold', nightMode ? 'text-slate-100' : 'text-ink')}>
          {nightMode && <Moon size={12} strokeWidth={2.4} className="text-slate-300" />}
          Live tracking (demo)
        </div>
        {!arrived && (
          <span className={cn('text-[10.5px] font-bold uppercase tracking-wide', nightMode ? 'text-slate-400' : 'text-slate/70')}>
            {steps.length ? `Step ${stepIndex + 1} of ${steps.length}` : ''}
          </span>
        )}
      </div>

      {route.length > 1 && (
        <div className="relative mx-3 mt-2 h-64 overflow-hidden rounded-[18px]">
          <Map
            className="h-full w-full"
            theme={nightMode ? 'dark' : 'light'}
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

          {/* Floating ETA/distance pill, top-left — same placement Grab
              uses for "8 min · 1.3 km". */}
          {!arrived && (
            <div className="absolute left-2.5 top-2.5 rounded-full bg-canvas-ink/90 px-3 py-1.5 text-[11.5px] font-bold text-white shadow-lg backdrop-blur-sm">
              {etaMinutes !== undefined ? `${etaMinutes} min` : 'Demo route'} · {remainingDistanceLabel(steps, stepIndex)}
            </div>
          )}

          {/* Floating turn banner, top, like Waze/Grab's active-navigation
              instruction card. */}
          {!arrived && currentStep && (
            <div
              className="absolute left-2.5 right-2.5 top-11 flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 shadow-lg backdrop-blur-sm"
              style={{ backgroundColor: deviationActive ? 'rgba(220,38,38,0.94)' : 'rgba(30,58,138,0.94)' }}
            >
              <Navigation2 size={18} strokeWidth={2.6} className="flex-shrink-0 text-white" />
              <div className="min-w-0 flex-1 text-white">
                <div className="truncate text-[13px] font-bold">{currentStep.instruction}</div>
                {currentStep.distanceM > 0 && <div className="text-[10.5px] opacity-85">in {currentStep.distanceM} m</div>}
              </div>
            </div>
          )}

          {arrived && (
            <div className="absolute left-2.5 top-2.5 rounded-full bg-verified px-3 py-1.5 text-[11.5px] font-bold text-white shadow-lg">
              Arrived
            </div>
          )}
        </div>
      )}

      {deviationActive && (
        <div className="mx-3 mt-2 flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-[11.5px] font-bold text-danger">
          <AlertTriangle size={13} strokeWidth={2.4} />
          Route deviation detected (demo) — resume navigation to clear it.
        </div>
      )}

      <div className="flex items-center justify-between gap-2 px-3.5 py-3">
        {!readOnly && onToggleGps ? (
          <button
            type="button"
            onClick={onToggleGps}
            disabled={arrived}
            className="tap-feedback flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-[12.5px] font-bold text-white disabled:opacity-50"
          >
            {arrived ? null : gpsRunning ? <Pause size={13} strokeWidth={2.6} /> : <Play size={13} strokeWidth={2.6} />}
            {arrived ? 'Arrived' : gpsRunning ? 'Pause' : progress > 0 ? 'Resume' : 'Start navigation'}
          </button>
        ) : (
          <span className={cn('text-[11px]', nightMode ? 'text-slate-300' : 'text-slate')}>
            {nextStep ? `Next: ${nextStep.instruction}` : 'Simulated Iloilo City route'}
          </span>
        )}
        {!readOnly && onSimulateDeviation && !arrived && (
          <button
            type="button"
            onClick={onSimulateDeviation}
            className="tap-feedback text-[11px] font-semibold text-slate/70 underline-offset-2 hover:underline"
          >
            Demo: simulate deviation
          </button>
        )}
      </div>
    </div>
  )
}
