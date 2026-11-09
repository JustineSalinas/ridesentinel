import { useQuery } from 'convex/react'
import { Link, Navigate } from 'react-router-dom'
import { QrCode, ScanLine } from 'lucide-react'
import { api } from '../../../convex/_generated/api'

export function HomePage() {
  const me = useQuery(api.profiles.getMe)
  const summary = useQuery(api.ratings.getMySummary)

  if (me === undefined) {
    return <div className="flex flex-1 items-center justify-center text-sm text-slate">Loading…</div>
  }
  if (me === null) {
    // Signed in but never finished registration (completeRegistration never ran).
    return <Navigate to="/register" replace />
  }

  const initials = me.displayName
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-mist bg-paper px-6 py-5">
        <div>
          <div className="text-[13px] text-slate">Hey, {me.displayName.split(' ')[0]}</div>
          <div
            className={
              'mt-1 flex items-center gap-1.5 font-mono text-[11px] font-bold tracking-widest ' +
              (me.verified ? 'text-verified' : 'text-pending')
            }
          >
            <span className={'h-1.5 w-1.5 rounded-full ' + (me.verified ? 'bg-verified' : 'bg-pending')} />
            {me.verified ? 'ID-VERIFIED' : 'NOT VERIFIED'}
          </div>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-[14px] font-bold text-white">
          {initials}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-6 py-5">
        {!me.verified && (
          <Link
            to="/verify"
            className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-semibold text-pending"
          >
            Get ID-verified to scan and show your QR
            <span>→</span>
          </Link>
        )}

        {summary && (
          <div className="flex items-center justify-between rounded-xl border border-mist bg-paper px-4 py-3">
            <div>
              <div className="text-[20px] font-extrabold">
                {summary.score ? summary.score.toFixed(1) : 'New'}
              </div>
              <div className="text-[12px] text-slate">{summary.confirmedMeetings} confirmed meetings</div>
            </div>
            <Link
              to="/interactions"
              className="font-mono text-[11px] font-bold text-brand-dark"
            >
              INTERACTIONS →
            </Link>
          </div>
        )}

        <div className="flex gap-3">
          <Link
            to="/qr"
            className="flex flex-1 flex-col items-center gap-2 rounded-2xl border border-mist bg-paper py-5"
          >
            <QrCode size={20} strokeWidth={1.8} className="text-ink" />
            <span className="text-sm font-bold">My QR</span>
          </Link>
          <Link
            to="/scan"
            className="flex flex-1 flex-col items-center gap-2 rounded-2xl bg-ink py-5 text-white"
          >
            <ScanLine size={20} strokeWidth={1.8} />
            <span className="text-sm font-bold">Scan</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
