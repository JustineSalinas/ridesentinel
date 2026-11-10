import { useQuery } from 'convex/react'
import { Link } from 'react-router-dom'
import { api } from '../../../convex/_generated/api'

export function AdminHomePage() {
  const me = useQuery(api.profiles.getMe)
  const pending = useQuery(api.admin.listPendingVerifications)
  const openReports = useQuery(api.admin.listOpenReports)
  const metrics = useQuery(api.admin.getPilotMetrics)

  return (
    <div className="flex min-h-dvh bg-mist">
      <div className="flex w-56 flex-shrink-0 flex-col gap-0.5 bg-ink py-6">
        <div className="flex items-center gap-2 px-5 pb-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand font-mono text-[11px] font-bold text-white">
            RS
          </div>
          <div className="text-sm font-extrabold text-white">RideSentinel</div>
        </div>
        <Link
          to="/admin/verifications"
          className="flex items-center justify-between px-5 py-2.5 text-[13.5px] font-semibold text-slate-400 hover:text-white"
        >
          Verifications
          {!!pending?.length && (
            <span className="rounded-full bg-brand px-1.5 font-mono text-[11px] text-white">
              {pending.length}
            </span>
          )}
        </Link>
        <Link
          to="/admin/reports"
          className="flex items-center justify-between px-5 py-2.5 text-[13.5px] font-semibold text-slate-400 hover:text-white"
        >
          Reports
          {!!openReports?.length && (
            <span className="rounded-full bg-danger px-1.5 font-mono text-[11px] text-white">
              {openReports.length}
            </span>
          )}
        </Link>
        <Link to="/admin/audit" className="px-5 py-2.5 text-[13.5px] font-semibold text-slate-400 hover:text-white">
          Audit log
        </Link>
        <div className="mt-4 border-t border-slate-800 px-5 pt-3.5">
          <div className="text-xs text-slate-500">Signed in as</div>
          <div className="text-[13px] font-semibold text-slate-200">{me?.displayName ?? '…'}</div>
        </div>
      </div>

      <div className="flex-1 p-9">
        <div className="text-[21px] font-extrabold">Admin dashboard</div>
        <div className="mt-0.5 text-[13px] text-slate">
          {pending?.length ? `${pending.length} verification request(s) waiting.` : 'Queue is clear.'}
        </div>

        <div className="mt-5 flex gap-3">
          <Link to="/admin/verifications" className="rounded-full bg-ink px-5 py-2.5 text-[13.5px] font-bold text-white">
            Review verifications →
          </Link>
          {!!openReports?.length && (
            <Link to="/admin/reports" className="rounded-full border border-danger px-5 py-2.5 text-[13.5px] font-bold text-danger">
              {openReports.length} open report(s) →
            </Link>
          )}
        </div>

        {metrics && (
          <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
            <Metric
              label="Scan success"
              value={metrics.scanSuccessRate !== null ? `${Math.round(metrics.scanSuccessRate * 100)}%` : '—'}
              target="≥90%"
            />
            <Metric
              label="Confirmation rate"
              value={metrics.confirmationRate !== null ? `${Math.round(metrics.confirmationRate * 100)}%` : '—'}
              target="≥80%"
            />
            <Metric
              label="Verify turnaround"
              value={
                metrics.medianTurnaroundMs !== null
                  ? `${(metrics.medianTurnaroundMs / 3_600_000).toFixed(1)}h`
                  : '—'
              }
              target="≤24h"
            />
          </div>
        )}
      </div>
    </div>
  )
}

function Metric({ label, value, target }: { label: string; value: string; target: string }) {
  return (
    <div className="rounded-xl border border-mist bg-paper p-4">
      <div className="text-[20px] font-extrabold">{value}</div>
      <div className="mt-0.5 text-[11.5px] text-slate">{label}</div>
      <div className="mt-1 font-mono text-[10px] font-bold text-slate-400">TARGET {target}</div>
    </div>
  )
}
