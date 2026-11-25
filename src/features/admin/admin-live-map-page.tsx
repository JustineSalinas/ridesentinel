import { useQuery } from 'convex/react'
import { Link } from 'react-router-dom'
import { ShieldAlert, AlertTriangle } from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import { Map, MapRoute, MapMarker, MarkerContent, MarkerTooltip } from '@/components/ui/map'
import { cn } from '@/lib/utils'

// Demo-scoped: every active ride's "location" is just its routeProgress
// along the one fixed Iloilo route (convex/lib/iloiloRoute.ts) — there is
// no real device GPS behind any marker here.
export function AdminLiveMapPage() {
  const rides = useQuery(api.admin.adminListActiveRides)
  const route = useQuery(api.rideRequests.demoRouteCoordinates)

  function pointAt(progress: number): [number, number] | null {
    if (!route || route.length < 2) return null
    const t = Math.min(1, Math.max(0, progress))
    const idx = t * (route.length - 1)
    const i0 = Math.floor(idx)
    const i1 = Math.min(route.length - 1, i0 + 1)
    const frac = idx - i0
    const [lng0, lat0] = route[i0]
    const [lng1, lat1] = route[i1]
    return [lng0 + (lng1 - lng0) * frac, lat0 + (lat1 - lat0) * frac]
  }

  return (
    <div className="flex min-h-dvh bg-mist">
      <div className="flex w-56 flex-shrink-0 flex-col gap-0.5 bg-ink py-6">
        <div className="flex items-center gap-2 px-5 pb-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand font-mono text-[11px] font-bold text-white">
            RS
          </div>
          <div className="text-sm font-extrabold text-white">RideSentinel</div>
        </div>
        <Link to="/admin" className="px-5 py-2.5 text-[13.5px] font-semibold text-slate-400 hover:text-white">
          Dashboard
        </Link>
        <Link to="/admin/verifications" className="px-5 py-2.5 text-[13.5px] font-semibold text-slate-400 hover:text-white">
          Verifications
        </Link>
        <Link to="/admin/reports" className="px-5 py-2.5 text-[13.5px] font-semibold text-slate-400 hover:text-white">
          Reports
        </Link>
        <Link to="/admin/live-map" className="px-5 py-2.5 text-[13.5px] font-semibold text-white">
          Live map
        </Link>
        <Link to="/admin/incidents" className="px-5 py-2.5 text-[13.5px] font-semibold text-slate-400 hover:text-white">
          Incidents
        </Link>
        <Link to="/admin/audit" className="px-5 py-2.5 text-[13.5px] font-semibold text-slate-400 hover:text-white">
          Audit log
        </Link>
      </div>

      <div className="flex flex-1 flex-col p-9">
        <div className="text-[21px] font-extrabold">Live map (demo)</div>
        <div className="mt-0.5 text-[13px] text-slate">
          {rides?.length ? `${rides.length} ride(s) in progress.` : 'No rides in progress right now.'}
        </div>

        <div className="mt-5 flex flex-1 gap-4">
          <div className="h-[520px] flex-1 overflow-hidden rounded-2xl border border-mist">
            {route && route.length > 1 && (
              <Map className="h-full w-full" viewport={{ center: route[Math.floor(route.length / 2)], zoom: 12.3, bearing: 0, pitch: 0 }}>
                <MapRoute coordinates={route} color="#cbd5e1" width={4} />
                {rides?.map((ride) => {
                  const point = pointAt(ride.routeProgress)
                  if (!point) return null
                  return (
                    <MapMarker key={ride.requestId} longitude={point[0]} latitude={point[1]}>
                      <MarkerContent>
                        <div
                          className={cn(
                            'flex h-4 w-4 items-center justify-center rounded-full border-2 border-white shadow',
                            ride.sosActive ? 'bg-danger' : ride.routeDeviationActive ? 'bg-pending' : 'bg-brand',
                          )}
                        />
                      </MarkerContent>
                      <MarkerTooltip>
                        <div className="text-[11.5px] font-semibold">
                          {ride.passengerName} · {ride.driverName}
                        </div>
                        <div className="text-[10.5px] text-slate">{Math.round(ride.routeProgress * 100)}% along route</div>
                      </MarkerTooltip>
                    </MapMarker>
                  )
                })}
              </Map>
            )}
          </div>

          <div className="flex w-72 flex-shrink-0 flex-col gap-2 overflow-y-auto">
            {rides?.length === 0 && <div className="rounded-xl border border-mist bg-paper p-4 text-[12.5px] text-slate">Nothing active.</div>}
            {rides?.map((ride) => (
              <div key={ride.requestId} className="rounded-xl border border-mist bg-paper p-3">
                <div className="text-[12.5px] font-bold">{ride.passengerName}</div>
                <div className="text-[11.5px] text-slate">Driver: {ride.driverName}</div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-mist">
                  <div className="h-full bg-brand" style={{ width: `${Math.round(ride.routeProgress * 100)}%` }} />
                </div>
                {ride.sosActive && (
                  <div className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-danger">
                    <ShieldAlert size={11} strokeWidth={2.4} />
                    SOS active
                  </div>
                )}
                {ride.routeDeviationActive && !ride.sosActive && (
                  <div className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-pending">
                    <AlertTriangle size={11} strokeWidth={2.4} />
                    Route deviation
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
