import { useQuery } from 'convex/react'
import { useParams } from 'react-router-dom'
import { ShieldAlert, ShieldCheck } from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import { RideNavigationCard } from './ride-navigation'

// No-auth, public page: what a passenger's trusted contact opens from the
// link generated on request-ride-page.tsx. Only ever shows the sanitized
// projection getSharedRide returns server-side — never a phone number,
// email, or exact note text. Polls live via the regular Convex query
// subscription, same as every authenticated page in this app.
export function SharedRidePage() {
  const { token } = useParams<{ token: string }>()
  const shared = useQuery(api.rideRequests.getSharedRide, token ? { token } : 'skip')
  const route = useQuery(api.rideRequests.demoRouteCoordinates)
  const steps = useQuery(api.rideRequests.demoRouteSteps)

  return (
    <div className="flex min-h-dvh flex-col items-center bg-page px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-1 text-[13px] font-bold uppercase tracking-wide text-slate">RideSentinel</div>
        <div className="mb-6 text-[20px] font-extrabold text-ink">Shared ride status</div>

        {shared === undefined && <div className="text-sm text-slate">Loading…</div>}

        {shared === null && (
          <div className="rounded-2xl bg-mist/60 px-4 py-4 text-[13px] text-slate">
            This link isn&apos;t valid, or the ride has ended.
          </div>
        )}

        {shared && (
          <div className="flex flex-col gap-4">
            {shared.sosActive && (
              <div className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-[13px] font-bold text-danger">
                <ShieldAlert size={16} strokeWidth={2.4} />
                An SOS alert was triggered on this ride (demo).
              </div>
            )}

            <div className="neu-out-sm flex items-center gap-3 rounded-2xl p-3.5">
              <div className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-full bg-mist">
                {shared.driver?.photoUrl && (
                  <img src={shared.driver.photoUrl} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 truncate text-[14px] font-bold text-ink">
                  {shared.driver?.displayName ?? 'Driver'}
                  {shared.driver?.verified && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-verified/10 px-1.5 py-0.5 text-[10px] font-bold text-verified">
                      <ShieldCheck size={10} strokeWidth={2.6} />
                      Verified
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-[11.5px] capitalize text-slate">
                  {shared.status}
                  {shared.estimatedEtaMinutes !== undefined && ` · ~${shared.estimatedEtaMinutes} min`}
                </div>
              </div>
            </div>

            {route && steps && (
              <RideNavigationCard
                route={route}
                steps={steps}
                progress={shared.routeProgress}
                gpsRunning={false}
                arrived={shared.routeProgress >= 1}
                etaMinutes={shared.estimatedEtaMinutes}
                deviationActive={shared.routeDeviationActive}
                readOnly
              />
            )}

            <p className="text-center text-[11px] leading-snug text-slate/80">
              Simulated location for demo purposes — this page updates live but does not show a real GPS
              position. No phone number or exact address is shared here.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
