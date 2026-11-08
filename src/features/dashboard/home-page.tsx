import { useQuery } from 'convex/react'
import { Link, Navigate } from 'react-router-dom'
import { api } from '../../../convex/_generated/api'
import { Badge } from '@/components/ui/badge'

export function HomePage() {
  const me = useQuery(api.profiles.getMe)

  if (me === undefined) {
    return <div className="flex flex-1 items-center justify-center text-sm text-slate">Loading…</div>
  }
  if (me === null) {
    // Signed in but never finished registration (completeRegistration never ran).
    return <Navigate to="/register" replace />
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-mist bg-paper px-6 py-5">
        <div>
          <div className="text-[13px] text-slate">Hey, {me.displayName.split(' ')[0]}</div>
          <div className="mt-0.5">
            {me.verified ? (
              <Badge tone="verified">✓ ID-verified</Badge>
            ) : (
              <Badge tone="pending">Not yet verified</Badge>
            )}
          </div>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-mist text-[15px] font-bold text-slate">
          {me.displayName
            .split(' ')
            .map((p) => p[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-6 py-4">
        {!me.verified && (
          <Link
            to="/verify"
            className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-semibold text-pending"
          >
            Get ID-verified to start scanning and showing your QR →
          </Link>
        )}

        <div className="flex gap-3">
          <Link
            to="/qr"
            className="flex flex-1 flex-col items-center gap-2 rounded-2xl border border-mist bg-paper py-[18px]"
          >
            <span className="text-sm font-bold">My QR</span>
          </Link>
          <Link
            to="/scan"
            className="flex flex-1 flex-col items-center gap-2 rounded-2xl bg-brand py-[18px] text-white"
          >
            <span className="text-sm font-bold">Scan</span>
          </Link>
        </div>

        <div className="rounded-xl border border-dashed border-mist bg-paper/60 px-4 py-3 text-[12.5px] text-slate">
          Interactions, ratings and the QR handshake ship in M3/M4 (docs/SPEC.md §14) — this dashboard
          is wired to your real account already.
        </div>
      </div>
    </div>
  )
}
