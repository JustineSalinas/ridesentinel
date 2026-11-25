import { Navigation2, AlertTriangle, Moon } from 'lucide-react'
import { Map, MapRoute, RouteProgress, RouteMarker, MarkerContent } from '@/components/ui/map'
import { stepIndexForProgress, ILOILO_DEMO_STEPS } from '../../../convex/lib/iloiloRoute'
import { cn } from '@/lib/utils'

type Step = (typeof ILOILO_DEMO_STEPS)[number]

// RideNavigationCard: the Grab/Waze-style turn-by-turn screen, shared by
// the passenger (request-ride-page.tsx) and driver (driver-requests-page.tsx)
// apps, and by the admin live map in a smaller read-only form. Everything
// here is demo data — a fixed Iloilo City route and a fixed instruction
// list (convex/lib/iloiloRoute.ts) advanced by `progress`, never a real
// routing/directions API. See docs/DECISIONS.md.
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

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl',
        nightMode ? 'neu-dark-out-sm' : 'neu-out-sm',
      )}
    >
      <div className={cn('flex items-center justify-between px-3 py-2', nightMode && 'text-slate-200')}>
        <div className={cn('text-[12.5px] font-bold', nightMode ? 'text-slate-100' : 'text-ink')}>
          {nightMode && <Moon size={12} strokeWidth={2.4} className="mr-1 inline-block text-slate-300" />}
          Live tracking (demo)
        </div>
        {!readOnly && onToggleGps && (
          <button
            type="button"
            onClick={onToggleGps}
            disabled={arrived}
            className="tap-feedback rounded-full bg-brand px-3 py-1.5 text-[11.5px] font-bold text-white disabled:opacity-50"
          >
            {arrived ? 'Arrived' : gpsRunning ? 'Pause' : progress > 0 ? 'Resume' : 'Start navigation'}
          </button>
        )}
      </div>

      {deviationActive && (
        <div className="mx-3 mb-2 flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-[11.5px] font-bold text-danger">
          <AlertTriangle size={13} strokeWidth={2.4} />
          Route deviation detected (demo) — resume navigation to clear it.
        </div>
      )}

      {!arrived && currentStep && (
        <div
          className={cn(
            'mx-3 mb-2 flex items-center gap-2.5 rounded-xl px-3 py-2.5',
            nightMode ? 'bg-black/30 text-slate-100' : 'bg-brand text-white',
          )}
        >
          <Navigation2 size={18} strokeWidth={2.4} className="flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-bold">{currentStep.instruction}</div>
            {currentStep.distanceM > 0 && (
              <div className="text-[11px] opacity-85">in {currentStep.distanceM} m</div>
            )}
          </div>
        </div>
      )}

      {route.length > 1 && (
        <div className="relative mx-3 mb-2 h-44 overflow-hidden rounded-xl">
          <Map
            className="h-full w-full"
            theme={nightMode ? 'dark' : 'light'}
            viewport={{ center: route[Math.floor(route.length / 2)], zoom: 12.5, bearing: 0, pitch: 0 }}
          >
            <MapRoute coordinates={route} progress={progress} color="#94a3b8">
              <RouteProgress color={deviationActive ? '#dc2626' : '#2563eb'} width={4} />
              <RouteMarker at="progress">
                <MarkerContent>
                  <div
                    className={cn(
                      'h-3.5 w-3.5 rounded-full border-2 border-white shadow',
                      deviationActive ? 'bg-danger' : 'bg-brand',
                    )}
                  />
                </MarkerContent>
              </RouteMarker>
            </MapRoute>
          </Map>
        </div>
      )}

      <div className={cn('flex items-center justify-between px-3 pb-3 text-[11px]', nightMode ? 'text-slate-300' : 'text-slate')}>
        <span>
          {arrived
            ? 'Arrived'
            : nextStep
              ? `Next: ${nextStep.instruction}`
              : etaMinutes !== undefined
                ? `~${etaMinutes} min total`
                : 'Simulated Iloilo City route'}
        </span>
        {!readOnly && onSimulateDeviation && !arrived && (
          <button
            type="button"
            onClick={onSimulateDeviation}
            className="tap-feedback font-semibold text-slate/70 underline-offset-2 hover:underline"
          >
            Demo: simulate deviation
          </button>
        )}
      </div>
    </div>
  )
}
