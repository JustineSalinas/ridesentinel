import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { Link } from 'react-router-dom'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

export function AdminVerificationsPage() {
  const pending = useQuery(api.admin.listPendingVerifications)
  const [selectedId, setSelectedId] = useState<Id<'verificationRequests'> | null>(null)

  const selected = selectedId ?? pending?.[0]?._id ?? null

  return (
    <div className="flex min-h-dvh bg-mist">
      <div className="flex w-56 flex-shrink-0 flex-col gap-0.5 bg-ink py-6">
        <div className="flex items-center gap-2 px-5 pb-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand font-mono text-[11px] font-bold text-white">
            RS
          </div>
          <div className="text-sm font-extrabold text-white">RideSentinel</div>
        </div>
        <Link
          to="/admin/verifications"
          className="flex items-center justify-between bg-slate-800 px-5 py-2.5 text-[13.5px] font-semibold text-white"
        >
          Verifications
          {!!pending?.length && (
            <span className="rounded-full bg-brand px-1.5 font-mono text-[11px]">{pending.length}</span>
          )}
        </Link>
        <Link to="/admin" className="px-5 py-2.5 text-[13.5px] font-semibold text-slate-400">
          Overview
        </Link>
      </div>

      <div className="flex flex-1 gap-7 p-9">
        <div className="flex w-[340px] flex-shrink-0 flex-col gap-3">
          <div>
            <div className="text-[20px] font-extrabold">Verification queue</div>
            <div className="font-mono text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Oldest first · {pending?.length ?? 0} pending
            </div>
          </div>

          {pending?.length === 0 && (
            <div className="rounded-xl border border-dashed border-mist bg-paper/60 px-4 py-6 text-center text-[13px] text-slate">
              Nothing to review.
            </div>
          )}

          {pending?.map((req) => (
            <button
              key={req._id}
              onClick={() => setSelectedId(req._id)}
              className={
                'rounded-xl border bg-paper p-4 text-left ' +
                (req._id === selected ? 'border-brand' : 'border-mist')
              }
            >
              <div className="font-mono text-[11px] font-bold text-slate-400">{req.idType}</div>
              <div className="mt-1 text-[13px] text-slate">
                Submitted {new Date(req.createdAt).toLocaleString()}
              </div>
            </button>
          ))}
        </div>

        <div className="flex-1 rounded-2xl border border-mist bg-paper p-7">
          {selected ? (
            <ReviewDetail requestId={selected} onDecided={() => setSelectedId(null)} />
          ) : (
            <div className="text-slate">
              {pending?.length === 0 ? 'Nothing left to review.' : 'Select a request.'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ReviewDetail({ requestId, onDecided }: { requestId: Id<'verificationRequests'>; onDecided: () => void }) {
  const detail = useQuery(api.admin.getVerificationDetail, { requestId })
  const getFileUrl = useMutation(api.admin.getFileUrl)
  const review = useMutation(api.admin.reviewVerification)

  const [idUrl, setIdUrl] = useState<string | null>(null)
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null)
  const [confirmed18, setConfirmed18] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  if (detail === undefined) return null
  if (detail === null) return <div className="text-slate">Not found.</div>

  async function reveal(kind: 'id' | 'selfie') {
    const url = await getFileUrl({ requestId, kind })
    if (kind === 'id') setIdUrl(url)
    else setSelfieUrl(url)
  }

  async function decide(decision: 'approve' | 'reject') {
    setBusy(true)
    try {
      await review({ requestId, decision, reason: reason || undefined, confirmed18Plus: confirmed18 })
      setIdUrl(null)
      setSelfieUrl(null)
      setConfirmed18(false)
      setReason('')
      onDecided()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="text-[18px] font-extrabold">{detail.displayName}</div>
        <div className="font-mono text-[11px] text-slate-400">#{requestId.slice(-6)}</div>
      </div>

      <div className="mt-5 flex gap-4">
        <FileSlot label="ID photo" url={idUrl} onReveal={() => reveal('id')} />
        <FileSlot label="Selfie" url={selfieUrl} onReveal={() => reveal('selfie')} />
      </div>

      <div className="mt-5 rounded-lg bg-mist px-4 py-2.5 text-[13px] text-slate">
        ID type: <strong>{detail.request.idType}</strong> — no ID number is stored or shown.
      </div>

      <label className="mt-5 flex items-start gap-2.5 text-[13px] text-ink">
        <input
          type="checkbox"
          checked={confirmed18}
          onChange={(e) => setConfirmed18(e.target.checked)}
          className="mt-0.5 h-4 w-4"
        />
        I confirm the selfie matches the ID photo and the applicant appears 18 or older.
      </label>

      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason — required to reject, optional to approve"
        className="mt-4 h-11 w-full rounded-lg border border-mist px-3 text-[13.5px]"
      />

      <div className="mt-4 flex gap-3">
        <button
          onClick={() => decide('reject')}
          disabled={busy || !reason}
          className="flex-1 rounded-lg border border-danger py-2.5 text-[14px] font-bold text-danger disabled:opacity-40"
        >
          Reject
        </button>
        <button
          onClick={() => decide('approve')}
          disabled={busy || !confirmed18}
          className="flex-1 rounded-lg bg-verified py-2.5 text-[14px] font-bold text-white disabled:opacity-40"
        >
          Approve · 12mo badge
        </button>
      </div>
    </div>
  )
}

function FileSlot({ label, url, onReveal }: { label: string; url: string | null; onReveal: () => void }) {
  return (
    <div className="flex-1">
      <div className="font-mono text-[10.5px] font-bold uppercase tracking-widest text-slate-400">
        {label}
      </div>
      {url ? (
        <img src={url} alt={label} className="mt-1.5 h-[150px] w-full rounded-lg object-cover" />
      ) : (
        <button
          onClick={onReveal}
          className="mt-1.5 flex h-[150px] w-full items-center justify-center rounded-lg bg-ink text-[12px] font-semibold text-slate-300"
        >
          Reveal (audited, 60s)
        </button>
      )}
    </div>
  )
}
