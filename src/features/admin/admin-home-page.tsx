import { useQuery } from 'convex/react'
import { Link } from 'react-router-dom'
import { api } from '../../../convex/_generated/api'
import { AdminSidebar } from './admin-sidebar'

export function AdminHomePage() {
  const pending = useQuery(api.admin.listPendingVerifications)
  const openReports = useQuery(api.admin.listOpenReports)
  const metrics = useQuery(api.admin.getPilotMetrics)

  return (
    <div className="flex min-h-dvh flex-col bg-mist md:flex-row">
      <AdminSidebar active="/admin" />

      <div className="flex-1 p-5 md:p-9">
        <div className="text-[21px] font-extrabold">Admin dashboard</div>
        <div className="mt-0.5 text-[13px] text-slate">
          {pending?.length ? `${pending.length} verification request(s) waiting.` : 'Queue is clear.'}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
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
          <div className="mt-8 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
              label="Verify turnaround (median)"
              value={
                metrics.medianTurnaroundMs !== null
                  ? `${(metrics.medianTurnaroundMs / 3_600_000).toFixed(1)}h`
                  : '—'
              }
              target="≤24h"
            />
            <Metric
              label="Verify turnaround (avg)"
              value={metrics.avgTurnaroundMs !== null ? `${(metrics.avgTurnaroundMs / 3_600_000).toFixed(1)}h` : '—'}
              target={`${metrics.totalDecided} decided`}
            />
            <Metric
              label="Pending >24h"
              value={String(metrics.pendingOver24h)}
              target="0 ideally"
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
