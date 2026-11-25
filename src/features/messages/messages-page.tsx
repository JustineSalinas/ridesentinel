import { useQuery } from 'convex/react'
import { Link } from 'react-router-dom'
import { Megaphone, Sparkles, MessageCircle } from 'lucide-react'
import { api } from '../../../convex/_generated/api'

export function MessagesPage() {
  const announcements = useQuery(api.messages.listAnnouncements)
  const conversations = useQuery(api.messages.listMyConversations)

  return (
    <div className="flex flex-1 flex-col gap-5 bg-page px-6 py-6">
      <div className="text-[20px] font-extrabold text-ink">Messages</div>

      <div className="flex flex-col gap-2.5">
        <div className="text-[12.5px] font-bold text-slate">Latest updates</div>
        {announcements === undefined && <div className="text-sm text-slate">Loading…</div>}
        {announcements?.length === 0 && <div className="text-[12.5px] text-slate">Nothing new right now.</div>}
        {announcements?.map((a) => (
          <div key={a._id} className="neu-out-sm flex gap-3 rounded-2xl p-3.5">
            <div
              className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
                a.kind === 'ad' ? 'bg-amber-50 text-pending' : 'bg-blue-50 text-brand'
              }`}
            >
              {a.kind === 'ad' ? <Megaphone size={16} strokeWidth={2.2} /> : <Sparkles size={16} strokeWidth={2.2} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-[13.5px] font-bold text-ink">{a.title}</span>
                {a.kind === 'ad' && (
                  <span className="flex-shrink-0 rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-pending">
                    Ad
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[12px] leading-snug text-slate">{a.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="text-[12.5px] font-bold text-slate">Ride conversations</div>
        {conversations === undefined && <div className="text-sm text-slate">Loading…</div>}
        {conversations?.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <div className="neu-out flex h-12 w-12 items-center justify-center rounded-full">
              <MessageCircle size={18} strokeWidth={1.8} className="text-slate" />
            </div>
            <p className="max-w-[240px] text-[12.5px] leading-snug text-slate">
              Messages with your driver or passenger appear here once you&apos;re matched on a ride.
            </p>
          </div>
        )}
        {conversations?.map((c) => (
          <Link
            key={c.rideRequestId}
            to={`/messages/${c.rideRequestId}`}
            className="tap-feedback neu-out-sm flex items-center gap-3 rounded-2xl p-3.5"
          >
            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-mist">
              {c.otherParty.photoUrl && <img src={c.otherParty.photoUrl} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13.5px] font-bold text-ink">{c.otherParty.displayName}</div>
              <div className="truncate text-[11.5px] text-slate">
                {c.lastMessage ? c.lastMessage.body : 'No messages yet — say hello'}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
