import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'
import { api } from '../../../convex/_generated/api'

export function ConversationPage() {
  const { rideRequestId } = useParams<{ rideRequestId: string }>()
  const id = rideRequestId as never
  const me = useQuery(api.profiles.getMe)
  const conversations = useQuery(api.messages.listMyConversations)
  const messages = useQuery(api.messages.listMessagesForRide, rideRequestId ? { rideRequestId: id } : 'skip')
  const sendMessage = useMutation(api.messages.sendMessage)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const conversation = conversations?.find((c) => c.rideRequestId === rideRequestId)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages?.length])

  async function send() {
    const body = draft.trim()
    if (!body || !rideRequestId) return
    setSending(true)
    try {
      await sendMessage({ rideRequestId: id, body })
      setDraft('')
    } catch {
      // Keep the draft so the user can retry.
    } finally {
      setSending(false)
    }
  }

  if (me === undefined || messages === undefined) return null

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-page">
      <div className="flex items-center gap-3 border-b border-mist px-6 py-4">
        <Link
          to="/messages"
          className="tap-feedback flex h-8 w-8 items-center justify-center rounded-full text-slate transition-colors hover:bg-mist hover:text-ink"
          aria-label="Back to messages"
        >
          <ArrowLeft size={16} strokeWidth={2.2} />
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-mist">
            {conversation?.otherParty.photoUrl && (
              <img src={conversation.otherParty.photoUrl} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <div className="text-[15px] font-bold text-ink">{conversation?.otherParty.displayName ?? 'Conversation'}</div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-5 py-4">
        {messages?.length === 0 && (
          <p className="pt-10 text-center text-[12.5px] text-slate">No messages yet — say hello.</p>
        )}
        {messages?.map((m) => {
          const mine = m.senderId === me?.userId
          return (
            <div
              key={m._id}
              className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-snug ${
                mine ? 'self-end bg-brand text-white' : 'self-start neu-in text-ink'
              }`}
            >
              {m.body}
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 border-t border-mist px-5 py-3.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, 500))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') send()
          }}
          placeholder="Message"
          className="neu-in h-11 flex-1 rounded-full px-4 text-[13.5px] text-ink placeholder:text-slate outline-none"
        />
        <button
          type="button"
          onClick={send}
          disabled={sending || !draft.trim()}
          className="tap-feedback flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-brand text-white disabled:opacity-50"
          aria-label="Send message"
        >
          <Send size={16} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  )
}
