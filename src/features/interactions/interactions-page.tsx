import { useQuery } from 'convex/react'
import { Link } from 'react-router-dom'
import { api } from '../../../convex/_generated/api'

export function InteractionsPage() {
  const rows = useQuery(api.interactions.listMine)

  return (
    <div className="flex flex-1 flex-col bg-page">
      <div className="flex items-center gap-3 px-6 py-5">
        <Link to="/home" className="text-[14px] font-semibold text-slate">
          ←
        </Link>
        <div className="text-[18px] font-extrabold text-ink">Interactions</div>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-6 py-2">
        {rows === undefined && <div className="text-sm text-slate">Loading…</div>}
        {rows?.length === 0 && <div className="text-sm text-slate">No interactions yet.</div>}

        {rows?.map(({ interaction, other, myRating }) => (
          <div key={interaction._id} className="neu-out-sm flex items-center gap-3 rounded-2xl p-3.5">
            <div className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-full bg-mist">
              {other?.photoUrl && <img src={other.photoUrl} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-bold text-ink">{other?.displayName ?? 'Unknown rider'}</div>
              <div className="mt-0.5 text-[11.5px] text-slate">
                {new Date(interaction.scannedAt).toLocaleDateString()}
              </div>
            </div>
            <StatusBit status={interaction.status} myRating={myRating} interactionId={interaction._id} />
          </div>
        ))}
      </div>
    </div>
  )
}

function StatusBit({
  status,
  myRating,
  interactionId,
}: {
  status: string
  myRating: number | null | undefined
  interactionId: string
}) {
  if (status === 'confirmed') {
    if (myRating) {
      return (
        <span className="flex-shrink-0 rounded-md bg-green-50 px-2 py-1 text-[11px] font-bold text-verified">
          You rated ★{myRating}
        </span>
      )
    }
    return (
      <Link
        to={`/rate/${interactionId}`}
        className="flex-shrink-0 rounded-full bg-brand px-3 py-1.5 text-[11px] font-bold text-white"
      >
        Rate →
      </Link>
    )
  }
  if (status === 'scanned') {
    return (
      <span className="flex-shrink-0 rounded-md bg-mist px-2 py-1 text-[11px] font-bold text-slate">
        Hidden — waiting
      </span>
    )
  }
  if (status === 'cancelled') {
    return (
      <span className="flex-shrink-0 rounded-md bg-red-50 px-2 py-1 text-[11px] font-bold text-danger">
        Reported
      </span>
    )
  }
  return (
    <span className="flex-shrink-0 rounded-md bg-mist px-2 py-1 text-[11px] font-bold text-slate/70">Expired</span>
  )
}
