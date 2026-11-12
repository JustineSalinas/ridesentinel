import { useQuery } from 'convex/react'
import { Link, Navigate } from 'react-router-dom'
import { QrCode, ScanLine, Star } from 'lucide-react'
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
    <div className="flex flex-1 flex-col bg-page">
      <div className="flex items-center justify-between px-6 py-5">
        <div>
          <div className="text-[15px] font-bold text-ink">Hey, {me.displayName.split(' ')[0]}</div>
          {me.verified ? (
            <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-bold text-verified">
              ✓ ID-verified
            </div>
          ) : (
            <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-pending">
              Not verified
            </div>
          )}
        </div>
        <div className="neu-out flex h-12 w-12 items-center justify-center rounded-full text-[14px] font-bold text-ink">
          {initials}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-5 px-6 pb-6">
        {!me.verified && (
          <Link
            to="/verify"
            className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3.5 text-[13px] font-semibold text-pending"
          >
            Get ID-verified to scan and show your QR
            <span>→</span>
          </Link>
        )}

        {summary && (
          <div className="neu-brand rounded-[22px] px-5 py-5 text-white">
            <div className="flex items-center gap-1.5 text-[13px] text-white/80">
              <Star size={14} fill="currentColor" strokeWidth={0} />
              Your rating
            </div>
            <div className="mt-1 text-[32px] font-extrabold leading-none">
              {summary.score ? summary.score.toFixed(1) : 'New'}
            </div>
            <div className="mt-1 text-[12.5px] text-white/80">
              from {summary.confirmedMeetings} confirmed meetings
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <Link to="/qr" className="neu-out flex flex-1 flex-col items-center gap-2 rounded-[22px] py-6">
            <QrCode size={20} strokeWidth={1.8} className="text-ink" />
            <span className="text-sm font-bold text-ink">My QR</span>
          </Link>
          <Link
            to="/scan"
            className="neu-brand flex flex-1 flex-col items-center gap-2 rounded-[22px] py-6 text-white"
          >
            <ScanLine size={20} strokeWidth={1.8} />
            <span className="text-sm font-bold">Scan</span>
          </Link>
        </div>

        {summary && (
          <Link
            to="/interactions"
            className="neu-out-sm flex items-center justify-between rounded-2xl px-4 py-3.5"
          >
            <span className="text-[13px] font-semibold text-ink">Recent interactions</span>
            <span className="text-[12px] font-semibold text-brand">See all →</span>
          </Link>
        )}
      </div>
    </div>
  )
}
