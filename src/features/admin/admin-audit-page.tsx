import { useQuery } from 'convex/react'
import { Link } from 'react-router-dom'
import { api } from '../../../convex/_generated/api'

export function AdminAuditPage() {
  const log = useQuery(api.admin.listAuditLog)

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
        <Link to="/admin/reports" className="px-5 py-2.5 text-[13.5px] font-semibold text-slate-400">
          Reports
        </Link>
        <Link
          to="/admin/audit"
          className="bg-slate-800 px-5 py-2.5 text-[13.5px] font-semibold text-white"
        >
          Audit log
        </Link>
      </div>

      <div className="flex-1 p-9">
        <div className="text-[20px] font-extrabold">Audit log</div>
        <div className="font-mono text-[11px] font-bold uppercase tracking-widest text-slate-400">
          Read-only · newest first
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border border-mist bg-paper">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-mist text-[11px] font-bold uppercase tracking-wide text-slate-400">
                <th className="px-4 py-2.5">Time</th>
                <th className="px-4 py-2.5">Action</th>
                <th className="px-4 py-2.5">Target</th>
                <th className="px-4 py-2.5">Reason</th>
              </tr>
            </thead>
            <tbody>
              {log?.map((entry) => (
                <tr key={entry._id} className="border-b border-mist text-[13px] last:border-0">
                  <td className="px-4 py-2.5 text-slate">{new Date(entry.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-2.5 font-bold">{entry.action}</td>
                  <td className="px-4 py-2.5 text-slate">
                    {entry.targetType} · {entry.targetId?.slice(-6)}
                  </td>
                  <td className="px-4 py-2.5 text-slate">{entry.reason ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {log?.length === 0 && <div className="p-6 text-center text-[13px] text-slate">No entries yet.</div>}
        </div>
      </div>
    </div>
  )
}
