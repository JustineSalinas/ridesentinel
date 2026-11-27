import { useQuery } from 'convex/react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthActions } from '@convex-dev/auth/react'
import { LogOut } from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import { cn } from '@/lib/utils'

// AdminSidebar: the one nav every admin screen shares. Previously each of
// the six admin pages hand-copied this block, and drifted — three had the
// full six-link nav, the other three were missing Live map/Incidents
// (added after those three were last touched) or even Reports/a way back
// to the dashboard. Self-contained (queries its own badge counts and
// "signed in as" name) so a page only needs `<AdminSidebar active="..." />`
// and can never fall out of sync with the others again.
//
// Responsive: a vertical left column on md+ screens, same as before;
// collapses to a horizontal scrollable top strip below md, since the admin
// console's content panes are still desktop-oriented (tables, side-by-side
// detail views) and a fixed 224px sidebar eating into a 375px phone
// viewport left next to nothing for content.
export function AdminSidebar({ active }: { active: string }) {
  const me = useQuery(api.profiles.getMe)
  const { signOut } = useAuthActions()
  const navigate = useNavigate()

  async function handleLogOut() {
    await signOut()
    navigate('/login')
  }
  const pending = useQuery(api.admin.listPendingVerifications)
  const reports = useQuery(api.admin.listOpenReports)
  const incidents = useQuery(api.admin.adminListSosIncidents)
  const unresolvedIncidents = incidents?.filter((i) => !i.sosResolvedAt).length ?? 0

  const links = [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/verifications', label: 'Verifications', count: pending?.length },
    { to: '/admin/reports', label: 'Reports', count: reports?.length, tone: 'danger' as const },
    { to: '/admin/live-map', label: 'Live map' },
    { to: '/admin/incidents', label: 'Incidents', count: unresolvedIncidents, tone: 'danger' as const },
    { to: '/admin/audit', label: 'Audit log' },
  ]

  return (
    <div className="flex w-full flex-shrink-0 flex-col gap-0.5 overflow-x-auto bg-ink md:w-56 md:overflow-visible md:py-6">
      <div className="flex flex-shrink-0 items-center justify-between gap-1.5 px-3 py-3 md:px-4 md:pb-5 md:pt-0">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-brand font-mono text-[11px] font-bold text-white">
            RS
          </div>
          <div className="truncate whitespace-nowrap text-sm font-extrabold text-white">RideSentinel</div>
        </div>
        <button
          onClick={handleLogOut}
          title="Log out"
          aria-label="Log out"
          className="flex flex-shrink-0 items-center justify-center rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white md:hidden"
        >
          <LogOut size={16} strokeWidth={2.4} />
        </button>
      </div>

      <div className="flex flex-shrink-0 gap-0.5 px-2 pb-2 md:flex-col md:px-0 md:pb-0">
        {links.map(({ to, label, count, tone }) => {
          const isActive = active === to
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex flex-shrink-0 items-center justify-between gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-[13.5px] font-semibold transition-colors md:rounded-none md:px-5',
                isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white',
              )}
            >
              {label}
              {!!count && (
                <span
                  className={cn(
                    'rounded-full px-1.5 font-mono text-[11px]',
                    tone === 'danger' ? 'bg-danger text-white' : 'bg-brand text-white',
                  )}
                >
                  {count}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      <div className="hidden flex-1 flex-col justify-end md:flex">
        <div className="border-t border-slate-800 px-5 pt-3.5">
          <div className="text-xs text-slate-500">Signed in as</div>
          <div className="truncate text-[13px] font-semibold text-slate-200">{me?.displayName ?? '…'}</div>
          <button
            onClick={handleLogOut}
            className="mt-3 flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-400 transition-colors hover:text-white"
          >
            <LogOut size={13} strokeWidth={2.4} />
            Log out
          </button>
        </div>
      </div>
    </div>
  )
}
