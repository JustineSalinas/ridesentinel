import { Link } from 'react-router-dom'
import { Bike, UserRound, ShieldCheck } from 'lucide-react'

// Pilot-demo convenience only — pre-fills the login email for a known test
// account so a presenter can switch roles fast without retyping addresses.
// Deliberately does NOT ship a password: credentials never belong in a
// public JS bundle, even for a demo account (DECISIONS.md, 2026-11-12).
const ROLES = [
  { label: 'Driver', email: 'demo@ridesentinel.app', icon: Bike },
  { label: 'Passenger', email: 'demo-passenger@ridesentinel.app', icon: UserRound },
  { label: 'Admin', email: 'qa-admin2@ridesentinel.app', icon: ShieldCheck },
] as const

export function DemoQuickAccess() {
  return (
    <div className="border-t border-white/10 bg-[#0B1120] px-6 py-5 md:px-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 md:flex-row md:justify-between">
        <div className="font-mono text-xs font-bold uppercase tracking-widest text-slate-300">
          Pilot demo · quick login
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {ROLES.map(({ label, email, icon: Icon }) => (
            <Link
              key={label}
              to={`/login?email=${encodeURIComponent(email)}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-1.5 text-[12.5px] font-semibold text-slate-100 transition-colors hover:border-white/30 hover:bg-white/[0.08] hover:text-white"
            >
              <Icon size={13} strokeWidth={2} className="text-slate-300" />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
