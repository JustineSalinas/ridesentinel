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
    <div className="border-t border-white/10 bg-ink px-7 py-8 md:px-16">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 md:flex-row md:justify-between">
        <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
          Pilot demo — quick access
        </div>
        <div className="flex gap-2">
          {ROLES.map(({ label, email, icon: Icon }) => (
            <Link
              key={label}
              to={`/login?email=${encodeURIComponent(email)}`}
              className="neu-dark-out-sm flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-bold text-white/80"
            >
              <Icon size={13} strokeWidth={2} />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
