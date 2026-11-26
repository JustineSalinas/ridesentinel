import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { AdminSidebar } from './admin-sidebar'

export function AdminAuditPage() {
  const log = useQuery(api.admin.listAuditLog)

  return (
    <div className="flex min-h-dvh flex-col bg-mist md:flex-row">
      <AdminSidebar active="/admin/audit" />

      <div className="flex-1 p-5 md:p-9">
        <div className="text-[20px] font-extrabold">Audit log</div>
        <div className="font-mono text-[11px] font-bold uppercase tracking-widest text-slate-400">
          Read-only · newest first
        </div>

        <div className="mt-5 overflow-x-auto rounded-xl border border-mist bg-paper">
          <table className="w-full min-w-[640px] text-left">
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
