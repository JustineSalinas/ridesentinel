import { useQuery } from 'convex/react'
import { Link, Navigate } from 'react-router-dom'
import { QrCode, ScanLine, Star, ShieldCheck, Users } from 'lucide-react'
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
    <div
      className="flex flex-1 flex-col"
      style={{ background: 'radial-gradient(130% 100% at 100% 0%, #EFF6FF 0%, #F1F5F9 55%)' }}
    >
      <div className="flex items-center justify-between px-6 pb-2 pt-6">
        <div>
          <div className="text-[26px] font-extrabold leading-tight tracking-tight text-ink">
            Hey, {me.displayName.split(' ')[0]}.
          </div>
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

      <div className="flex flex-1 flex-col gap-5 px-6 pb-6 pt-4">
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
          <div className="neu-out rounded-[26px] bg-paper p-5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-slate">Your rating</span>
              <Star size={16} className="text-pending" fill="#D97706" />
            </div>
            <div className="mt-1 text-[44px] font-extrabold leading-none tracking-tight text-ink">
              {summary.score ? summary.score.toFixed(1) : 'New'}
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-mist pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-[13px] text-slate">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50">
                    <Users size={13} className="text-brand" />
                  </span>
                  Confirmed meetings
                </div>
                <span className="text-[14px] font-bold text-ink">{summary.confirmedMeetings}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-[13px] text-slate">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-50">
                    <ShieldCheck size={13} className="text-verified" />
                  </span>
                  Verification tier
                </div>
                <span className="text-[14px] font-bold text-ink">{me.verified ? '12mo badge' : '—'}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Link
            to="/scan"
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-ink py-4 text-white"
          >
            <ScanLine size={18} strokeWidth={2} />
            <span className="text-sm font-bold">Scan</span>
          </Link>
          <Link
            to="/qr"
            className="neu-out flex flex-1 items-center justify-center gap-2 rounded-full py-4 text-ink"
          >
            <QrCode size={18} strokeWidth={2} />
            <span className="text-sm font-bold">My QR</span>
          </Link>
        </div>

        {summary && (
          <Link to="/interactions" className="neu-out-sm flex items-center gap-3 rounded-2xl px-4 py-3.5">
            {summary.confirmedMeetings > 0 ? (
              <div className="flex -space-x-2">
                {Array.from({ length: Math.min(3, summary.confirmedMeetings) }).map((_, i) => (
                  <div key={i} className="h-7 w-7 rounded-full border-2 border-paper bg-mist" />
                ))}
              </div>
            ) : (
              <Users size={16} className="text-slate" />
            )}
            <div className="flex-1">
              <div className="text-[13px] font-bold text-ink">Recent interactions</div>
              <div className="text-[11.5px] text-slate">
                {summary.confirmedMeetings > 0 ? `${summary.confirmedMeetings} confirmed so far` : 'None yet'}
              </div>
            </div>
            <span className="text-[12px] font-semibold text-brand">See all →</span>
          </Link>
        )}
      </div>
    </div>
  )
}
