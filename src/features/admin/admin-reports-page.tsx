import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { Link } from 'react-router-dom'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

export function AdminReportsPage() {
  const reports = useQuery(api.admin.listOpenReports)
  const [selectedId, setSelectedId] = useState<Id<'reports'> | null>(null)
  const selected = selectedId ?? reports?.[0]?._id ?? null

  return (
    <div className="flex min-h-dvh bg-mist">
      <div className="flex w-56 flex-shrink-0 flex-col gap-0.5 bg-ink py-6">
        <div className="flex items-center gap-2 px-5 pb-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand font-mono text-[11px] font-bold text-white">
            RS
          </div>
          <div className="text-sm font-extrabold text-white">RideSentinel</div>
        </div>
        <Link to="/admin/verifications" className="px-5 py-2.5 text-[13.5px] font-semibold text-slate-400">
          Verifications
        </Link>
        <Link
          to="/admin/reports"
          className="flex items-center justify-between bg-slate-800 px-5 py-2.5 text-[13.5px] font-semibold text-white"
        >
          Reports
          {!!reports?.length && (
            <span className="rounded-full bg-danger px-1.5 font-mono text-[11px]">{reports.length}</span>
          )}
        </Link>
        <Link to="/admin/audit" className="px-5 py-2.5 text-[13.5px] font-semibold text-slate-400">
          Audit log
        </Link>
      </div>

      <div className="flex flex-1 gap-7 p-9">
        <div className="flex w-[340px] flex-shrink-0 flex-col gap-3">
          <div className="text-[20px] font-extrabold">Reports</div>
          {reports?.length === 0 && (
            <div className="rounded-xl border border-dashed border-mist bg-paper/60 px-4 py-6 text-center text-[13px] text-slate">
              Nothing open.
            </div>
          )}
          {reports?.map((r) => (
            <button
              key={r._id}
              onClick={() => setSelectedId(r._id)}
              className={
                'rounded-xl border bg-paper p-4 text-left ' + (r._id === selected ? 'border-brand' : 'border-mist')
              }
            >
              <div className="font-mono text-[11px] font-bold uppercase tracking-wide text-danger">{r.reason}</div>
              <div className="mt-1 text-[12px] text-slate">{new Date(r.createdAt).toLocaleString()}</div>
            </button>
          ))}
        </div>

        <div className="flex-1 rounded-2xl border border-mist bg-paper p-7">
          {selected ? (
            <ReportDetail reportId={selected} onHandled={() => setSelectedId(null)} />
          ) : (
            <div className="text-slate">{reports?.length === 0 ? 'Nothing left to review.' : 'Select a report.'}</div>
          )}
        </div>
      </div>
    </div>
  )
}

function ReportDetail({ reportId, onHandled }: { reportId: Id<'reports'>; onHandled: () => void }) {
  const detail = useQuery(api.admin.getReportDetail, { reportId })
  const handle = useMutation(api.admin.handleReport)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  if (detail === undefined) return null
  if (detail === null) return <div className="text-slate">Not found.</div>

  async function act(action: 'dismiss' | 'warn' | 'remove_rating' | 'suspend' | 'revoke_tier') {
    setBusy(true)
    try {
      await handle({ reportId, action, reason })
      setReason('')
      onHandled()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="font-mono text-[11px] font-bold uppercase tracking-wide text-danger">
        {detail.report.reason}
      </div>
      <div className="mt-2 flex gap-4">
        <div className="flex-1 rounded-lg bg-mist p-3">
          <div className="text-[11px] font-bold text-slate-500">REPORTER</div>
          <div className="text-[14px] font-bold">{detail.reporterName}</div>
        </div>
        <div className="flex-1 rounded-lg bg-mist p-3">
          <div className="text-[11px] font-bold text-slate-500">REPORTED</div>
          <div className="text-[14px] font-bold">{detail.reportedName ?? '—'}</div>
        </div>
      </div>

      {detail.report.details && (
        <div className="mt-4 rounded-lg bg-mist p-3 text-[13px] text-ink">{detail.report.details}</div>
      )}

      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason for action (required)"
        className="mt-5 h-11 w-full rounded-lg border border-mist px-3 text-[13.5px]"
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => act('dismiss')} disabled={busy || !reason} className="flex-1 rounded-lg border border-mist py-2.5 text-[13.5px] font-bold disabled:opacity-40">
          Dismiss
        </button>
        <button onClick={() => act('warn')} disabled={busy || !reason} className="flex-1 rounded-lg border border-pending text-pending py-2.5 text-[13.5px] font-bold disabled:opacity-40">
          Warn
        </button>
        {detail.report.ratingId && (
          <button onClick={() => act('remove_rating')} disabled={busy || !reason} className="flex-1 rounded-lg border border-pending text-pending py-2.5 text-[13.5px] font-bold disabled:opacity-40">
            Remove rating
          </button>
        )}
        <button onClick={() => act('suspend')} disabled={busy || !reason} className="flex-1 rounded-lg border border-danger text-danger py-2.5 text-[13.5px] font-bold disabled:opacity-40">
          Suspend
        </button>
        <button onClick={() => act('revoke_tier')} disabled={busy || !reason} className="flex-1 rounded-lg bg-danger text-white py-2.5 text-[13.5px] font-bold disabled:opacity-40">
          Revoke tier
        </button>
      </div>
    </div>
  )
}
