import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { ShieldAlert } from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { AdminSidebar } from './admin-sidebar'

export function AdminIncidentsPage() {
  const incidents = useQuery(api.admin.adminListSosIncidents)
  const resolve = useMutation(api.admin.resolveSosIncident)
  const [reasonById, setReasonById] = useState<Record<string, string>>({})
  const [busyId, setBusyId] = useState<Id<'rideRequests'> | null>(null)

  async function act(requestId: Id<'rideRequests'>) {
    const reason = reasonById[requestId] ?? ''
    if (!reason.trim()) return
    setBusyId(requestId)
    try {
      await resolve({ requestId, reason })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-mist md:flex-row">
      <AdminSidebar active="/admin/incidents" />

      <div className="flex-1 p-5 md:p-9">
        <div className="text-[21px] font-extrabold">SOS incidents</div>
        <div className="mt-0.5 text-[13px] text-slate">
          SOS triggers from the ride apps, newest first. Resolving here only clears the urgent flag — the
          underlying report still goes through the normal Reports queue if it needs an action.
        </div>

        <div className="mt-5 flex max-w-2xl flex-col gap-3">
          {incidents?.length === 0 && (
            <div className="rounded-xl border border-dashed border-mist bg-paper/60 px-4 py-6 text-center text-[13px] text-slate">
              No SOS incidents.
            </div>
          )}
          {incidents?.map((incident) => (
            <div
              key={incident.requestId}
              className={`rounded-xl border bg-paper p-4 ${incident.sosResolvedAt ? 'border-mist opacity-70' : 'border-danger'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[13px] font-bold text-danger">
                  <ShieldAlert size={14} strokeWidth={2.4} />
                  {incident.passengerName} · {incident.driverName}
                </div>
                <div className="text-[11.5px] text-slate">{new Date(incident.sosAt).toLocaleString()}</div>
              </div>
              <div className="mt-1 text-[11.5px] capitalize text-slate">Ride status: {incident.status}</div>

              {incident.sosResolvedAt ? (
                <div className="mt-2 text-[12px] font-semibold text-verified">
                  Resolved {new Date(incident.sosResolvedAt).toLocaleString()}
                </div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <input
                    value={reasonById[incident.requestId] ?? ''}
                    onChange={(e) => setReasonById((prev) => ({ ...prev, [incident.requestId]: e.target.value }))}
                    placeholder="Resolution note (required)"
                    className="h-9 flex-1 rounded-lg border border-mist px-3 text-[12.5px]"
                  />
                  <button
                    onClick={() => act(incident.requestId)}
                    disabled={busyId === incident.requestId || !reasonById[incident.requestId]?.trim()}
                    className="rounded-lg bg-ink px-3.5 py-2 text-[12.5px] font-bold text-white disabled:opacity-40"
                  >
                    Resolve
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
