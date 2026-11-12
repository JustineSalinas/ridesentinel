import { useState } from 'react'
import { useMutation } from 'convex/react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

type Reason = 'impersonation' | 'abusive_or_unsafe' | 'fake_or_coerced_rating'

const REASONS: { value: Reason; title: string; body: string }[] = [
  { value: 'impersonation', title: 'Impersonation / face mismatch', body: 'The person didn’t match their ID photo.' },
  { value: 'abusive_or_unsafe', title: 'Abusive or unsafe conduct', body: 'Threats, harassment, or reckless behavior.' },
  { value: 'fake_or_coerced_rating', title: 'Fake or coerced rating', body: 'You were pressured, or a rating looks manipulated.' },
]

export function ReportPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const fileReport = useMutation(api.reports.fileReport)

  const interactionId = params.get('interactionId') as Id<'interactions'> | null
  const initialReason = (params.get('reason') as Reason) ?? 'impersonation'

  const [reason, setReason] = useState<Reason>(initialReason)
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function submit() {
    setSubmitting(true)
    try {
      await fileReport({
        reason,
        details: details || undefined,
        interactionId: interactionId ?? undefined,
      })
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-page px-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 13l4 4L19 7" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-[20px] font-extrabold text-ink">Report sent</h1>
        <p className="max-w-[260px] text-[13px] text-slate">
          An administrator will review this within a few days.
        </p>
        <Link to="/home" className="mt-2 text-[13px] font-bold text-brand">
          Back to home
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-page">
      <div className="flex items-center justify-between px-6 py-5">
        <button onClick={() => navigate(-1)} className="text-[13px] font-semibold text-slate">
          ← Cancel
        </button>
        <div className="text-[12px] font-bold uppercase tracking-wide text-slate">Report</div>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-6 pb-8">
        <h1 className="text-[20px] font-extrabold text-ink">What happened?</h1>

        <div className="flex flex-col gap-2">
          {REASONS.map((r) => (
            <button
              key={r.value}
              onClick={() => setReason(r.value)}
              className={
                'rounded-xl border p-4 text-left ' +
                (reason === r.value ? 'border-brand bg-blue-50' : 'border-[#CBD5E1] bg-paper')
              }
            >
              <div className="text-[14px] font-bold text-ink">{r.title}</div>
              <div className="mt-0.5 text-[12px] text-slate">{r.body}</div>
            </button>
          ))}
        </div>

        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value.slice(0, 500))}
          placeholder="Details (optional, 500 characters)"
          className="h-24 resize-none rounded-xl border border-[#CBD5E1] bg-paper p-3 text-[13.5px] text-ink placeholder:text-slate"
        />

        <button
          onClick={submit}
          disabled={submitting}
          className="mt-auto flex h-[52px] items-center justify-center rounded-xl bg-danger text-[15px] font-bold text-white disabled:opacity-60"
        >
          {submitting ? 'Submitting…' : 'Submit report'}
        </button>
      </div>
    </div>
  )
}
