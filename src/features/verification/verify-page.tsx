import { useRef, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { Link } from 'react-router-dom'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { compressImage } from '@/lib/image'

const ID_TYPES = ["Driver's license", 'National ID', 'School ID']

export function VerifyPage() {
  const request = useQuery(api.verification.getMine)
  const generateUploadUrl = useMutation(api.verification.generateUploadUrl)
  const submit = useMutation(api.verification.submit)

  const [idType, setIdType] = useState(ID_TYPES[0])
  const [idPhoto, setIdPhoto] = useState<File | null>(null)
  const [selfie, setSelfie] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const idInputRef = useRef<HTMLInputElement>(null)
  const selfieInputRef = useRef<HTMLInputElement>(null)

  async function upload(file: File): Promise<Id<'_storage'>> {
    const compressed = await compressImage(file)
    const url = await generateUploadUrl()
    const res = await fetch(url, { method: 'POST', body: compressed })
    const { storageId } = (await res.json()) as { storageId: Id<'_storage'> }
    return storageId
  }

  async function handleSubmit() {
    if (!idPhoto || !selfie) return
    setError(null)
    setSubmitting(true)
    try {
      const [idPhotoStorageId, selfieStorageId] = await Promise.all([upload(idPhoto), upload(selfie)])
      await submit({ idType, idPhotoStorageId, selfieStorageId })
    } catch {
      setError('Could not submit. Check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (request === undefined) {
    return <div className="flex min-h-dvh items-center justify-center bg-page text-sm text-slate">Loading…</div>
  }

  if (request && request.status !== 'rejected') {
    return <StatusView status={request.status} reason={request.reason} />
  }

  return (
    <div className="flex min-h-dvh flex-col bg-page">
      <div className="border-b border-mist bg-paper px-6 py-5">
        <div className="text-[11px] font-bold uppercase tracking-widest text-slate">Verification</div>
        <h1 className="mt-1 text-[21px] font-extrabold tracking-tight text-ink">Get ID-verified</h1>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-6 py-6">
        {request?.status === 'rejected' && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <div className="text-[12px] font-bold uppercase tracking-wide text-danger">Not approved — resubmit</div>
            <div className="mt-1 text-[13px] leading-snug text-ink">{request.reason}</div>
          </div>
        )}

        {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-[13px] text-danger">{error}</div>}

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-[#334155]">ID type</label>
          <select
            value={idType}
            onChange={(e) => setIdType(e.target.value)}
            className="h-12 rounded-[10px] border border-[#CBD5E1] bg-paper px-3 text-[15px] text-ink"
          >
            {ID_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>

        <UploadField
          id="id-photo-input"
          label="Photo of your ID"
          file={idPhoto}
          inputRef={idInputRef}
          onPick={setIdPhoto}
          hint="No ID number is read or stored."
        />
        <UploadField
          id="selfie-input"
          label="Selfie"
          file={selfie}
          inputRef={selfieInputRef}
          onPick={setSelfie}
          hint="Make sure your face is clear."
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!idPhoto || !selfie || submitting}
          className="mt-2 flex h-[52px] items-center justify-center rounded-xl bg-brand text-[16px] font-bold text-white disabled:opacity-60"
        >
          {submitting ? 'Submitting…' : 'Submit for review'}
        </button>
      </div>
    </div>
  )
}

function UploadField({
  id,
  label,
  file,
  inputRef,
  onPick,
  hint,
}: {
  id: string
  label: string
  file: File | null
  inputRef: React.RefObject<HTMLInputElement | null>
  onPick: (f: File) => void
  hint: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-[#334155]">
        {label}
      </label>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex h-[120px] flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-[#94A3B8] text-center"
      >
        {file ? (
          <span className="text-[13px] font-semibold text-verified">✓ {file.name}</span>
        ) : (
          <span className="text-[12.5px] text-slate">Tap to capture or upload</span>
        )}
      </button>
      <input
        id={id}
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])}
      />
      <span className="text-[11.5px] text-slate">{hint}</span>
    </div>
  )
}

function StatusView({ status, reason }: { status: 'pending' | 'approved'; reason?: string }) {
  const copy =
    status === 'approved'
      ? { title: "You're ID-verified", body: 'An administrator checked your ID.' }
      : { title: 'Pending review', body: 'Usually decided within 24 hours.' }

  const circleClass = status === 'approved' ? 'bg-green-50' : 'bg-amber-50'
  const iconColor = status === 'approved' ? '#16A34A' : '#D97706'

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-page px-7 text-center">
      <div className={`flex h-16 w-16 items-center justify-center rounded-full ${circleClass}`}>
        {status === 'approved' ? (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M5 13l4 4L19 7"
              stroke={iconColor}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke={iconColor} strokeWidth="1.8" />
            <path d="M12 7v5l3 3" stroke={iconColor} strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        )}
      </div>
      <h1 className="text-[20px] font-extrabold tracking-tight text-ink">{copy.title}</h1>
      <p className="max-w-[260px] text-[13.5px] leading-snug text-slate">{reason ?? copy.body}</p>
      <Link
        to="/home"
        className="mt-4 flex h-12 w-full max-w-[280px] items-center justify-center rounded-xl bg-brand text-[14px] font-bold text-white"
      >
        Back to home
      </Link>
    </div>
  )
}
