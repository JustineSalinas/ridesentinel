import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'

export function AdminHomePage() {
  const me = useQuery(api.profiles.getMe)

  return (
    <div className="flex min-h-dvh bg-mist">
      <div className="flex w-56 flex-shrink-0 flex-col gap-0.5 bg-ink py-6">
        <div className="flex items-center gap-2 px-5 pb-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2L3 7v6c0 5 4 8 9 9 5-1 9-4 9-9V7l-9-5z" fill="#FFFFFF" />
            </svg>
          </div>
          <div className="text-sm font-extrabold text-white">RideSentinel</div>
        </div>
        <div className="bg-slate-800 px-5 py-2.5 text-[13.5px] font-semibold text-white">
          Verifications
        </div>
        <div className="px-5 py-2.5 text-[13.5px] font-semibold text-slate-400">Reports</div>
        <div className="px-5 py-2.5 text-[13.5px] font-semibold text-slate-400">Audit log</div>
        <div className="mt-4 border-t border-slate-800 px-5 pt-3.5">
          <div className="text-xs text-slate-500">Signed in as</div>
          <div className="text-[13px] font-semibold text-slate-200">{me?.displayName ?? '…'}</div>
        </div>
      </div>

      <div className="flex-1 p-9">
        <div className="text-[21px] font-extrabold">Admin dashboard</div>
        <div className="mt-0.5 text-[13px] text-slate">
          Signed in and confirmed as an administrator.
        </div>
        <div className="mt-6 max-w-md rounded-xl border border-dashed border-mist bg-paper/60 px-4 py-3 text-[12.5px] text-slate">
          The verification queue, reports queue and audit log ship in M2/M4 (docs/SPEC.md §14). This
          route is already locked to admins only — <code>RequireAdmin</code> redirects anyone else to
          <code> /home</code>, and the underlying data will only ever be reachable through Convex
          functions that call <code>requireAdmin</code>.
        </div>
      </div>
    </div>
  )
}
