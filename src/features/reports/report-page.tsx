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
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-ink px-8 text-center text-white">
        <div className="font-mono text-[11px] font-bold tracking-widest text-brand">SUBMITTED</div>
        <h1 className="text-[20px] font-extrabold">Report sent</h1>
        <p className="max-w-[260px] text-[13px] text-slate-300">
          An administrator will review this within a few days.
        </p>
        <Link to="/home" className="mt-2 font-mono text-[12px] font-bold text-brand">
          HOME →
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-ink text-white">
      <div className="flex items-center justify-between px-6 py-5">
        <button onClick={() => navigate(-1)} className="font-mono text-[11px] font-bold tracking-wide text-slate-400">
          ← CANCEL
        </button>
        <div className="font-mono text-[11px] font-bold tracking-widest text-slate-400">REPORT</div>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-6 pb-8">
        <h1 className="text-[20px] font-extrabold">What happened?</h1>

        <div className="flex flex-col gap-2">
          {REASONS.map((r) => (
            <button
              key={r.value}
              onClick={() => setReason(r.value)}
              className={
                'rounded-xl border p-4 text-left ' +
                (reason === r.value ? 'border-brand bg-brand/10' : 'border-slate-700')
              }
            >
              <div className="text-[14px] font-bold">{r.title}</div>
              <div className="mt-0.5 text-[12px] text-slate-400">{r.body}</div>
            </button>
          ))}
        </div>

        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value.slice(0, 500))}
          placeholder="Details (optional, 500 characters)"
          className="h-24 resize-none rounded-xl border border-slate-700 bg-transparent p-3 text-[13.5px] text-white placeholder:text-slate-500"
        />

        <button
          onClick={submit}
          disabled={submitting}
          className="mt-auto flex h-[52px] items-center justify-center rounded-full bg-danger text-[15px] font-bold text-white disabled:opacity-40"
        >
          {submitting ? 'Submitting…' : 'Submit report'}
        </button>
      </div>
    </div>
  )
}
