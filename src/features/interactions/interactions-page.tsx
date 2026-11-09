import { useQuery } from 'convex/react'
import { Link } from 'react-router-dom'
import { api } from '../../../convex/_generated/api'

const STATUS_LABEL: Record<string, string> = {
  scanned: 'Waiting',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  expired: 'Expired',
}

export function InteractionsPage() {
  const rows = useQuery(api.interactions.listMine)

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-3 border-b border-mist bg-paper px-6 py-5">
        <Link to="/home" className="text-[14px] font-semibold text-slate">
          ←
        </Link>
        <div className="text-[18px] font-extrabold">Interactions</div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 px-6 py-4">
        {rows === undefined && <div className="text-sm text-slate">Loading…</div>}
        {rows?.length === 0 && <div className="text-sm text-slate">No interactions yet.</div>}

        {rows?.map(({ interaction, other, myRating }) => (
          <div
            key={interaction._id}
            className="flex items-center gap-3 rounded-xl border border-mist bg-paper p-3.5"
          >
            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-mist">
              {other?.photoUrl && <img src={other.photoUrl} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-bold">{other?.displayName ?? 'Unknown'}</div>
              <div className="text-[11.5px] text-slate">
                {new Date(interaction.scannedAt).toLocaleDateString()} · {STATUS_LABEL[interaction.status]}
              </div>
            </div>
            {interaction.status === 'confirmed' &&
              (myRating ? (
                <span className="font-mono text-[11px] font-bold text-verified">RATED</span>
              ) : (
                <Link
                  to={`/rate/${interaction._id}`}
                  className="rounded-full bg-ink px-3 py-1.5 font-mono text-[11px] font-bold text-white"
                >
                  RATE
                </Link>
              ))}
          </div>
        ))}
      </div>
    </div>
  )
}
