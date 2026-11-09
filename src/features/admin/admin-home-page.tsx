import { useQuery } from 'convex/react'
import { Link } from 'react-router-dom'
import { api } from '../../../convex/_generated/api'

export function AdminHomePage() {
  const me = useQuery(api.profiles.getMe)
  const pending = useQuery(api.admin.listPendingVerifications)

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
        <div className="px-5 py-2.5 text-[13.5px] font-semibold text-slate-500">Reports</div>
        <div className="px-5 py-2.5 text-[13.5px] font-semibold text-slate-500">Audit log</div>
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
        <Link
          to="/admin/verifications"
          className="mt-5 inline-block rounded-full bg-ink px-5 py-2.5 text-[13.5px] font-bold text-white"
        >
          Review verifications →
        </Link>
        <div className="mt-6 max-w-md rounded-xl border border-dashed border-mist bg-paper/60 px-4 py-3 text-[12.5px] text-slate">
          Reports queue and audit log ship in M4 (docs/SPEC.md §14).
        </div>
      </div>
    </div>
  )
}
