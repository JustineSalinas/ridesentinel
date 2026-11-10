import { useState } from 'react'
import { useMutation } from 'convex/react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../../convex/_generated/api'
import { TERMS_OF_USE, COMMUNITY_GUIDELINES } from './terms'

const POINTS = [
  [
    'DATA',
    'What we collect',
    'Your name, an ID photo, and a selfie. No ID number, ever. No location, ever.',
  ],
  [
    'SEES',
    'Who sees it',
    'Only a named administrator reviews your ID. Other riders only ever see your name, photo, tier, and rating.',
  ],
  [
    'DELETE',
    'Deletion',
    'ID and selfie photos are deleted 30 days after review. You can delete your account anytime.',
  ],
] as const

export function ConsentPage() {
  const setConsent = useMutation(api.profiles.setConsent)
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [showTerms, setShowTerms] = useState(false)

  async function agree() {
    setSubmitting(true)
    try {
      await setConsent({})
      navigate('/verify')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-ink text-white">
      <div className="px-7 pb-8 pt-12">
        <div className="font-mono text-[11px] font-bold uppercase tracking-widest text-slate-500">
          Before you continue
        </div>
        <h1 className="mt-2 text-[26px] font-extrabold leading-tight tracking-tight">
          Your data, in three lines
        </h1>
      </div>

      <div className="flex flex-1 flex-col rounded-t-[28px] bg-paper px-7 pt-8 text-ink">
        <div className="flex flex-col gap-5">
          {POINTS.map(([tag, title, body]) => (
            <div key={tag} className="flex gap-4">
              <span className="mt-0.5 flex h-7 w-14 flex-shrink-0 items-center justify-center rounded-md border border-mist font-mono text-[10.5px] font-bold text-brand-dark">
                {tag}
              </span>
              <div>
                <div className="text-[15px] font-bold">{title}</div>
                <div className="mt-0.5 text-[13px] leading-snug text-slate">{body}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12.5px] leading-snug text-pending">
          A badge is not a safety guarantee. RideSentinel doesn&apos;t arrange, price, or operate rides
          &mdash; you&apos;re responsible for your own judgment and conduct.
        </div>

        <button
          type="button"
          onClick={() => setShowTerms((v) => !v)}
          className="mt-4 self-start font-mono text-[11px] font-bold tracking-wide text-brand-dark"
        >
          {showTerms ? '← HIDE FULL TERMS' : 'READ FULL TERMS →'}
        </button>

        {showTerms && (
          <div className="mt-3 max-h-[220px] overflow-y-auto rounded-xl border border-mist bg-mist/40 p-4">
            <pre className="whitespace-pre-wrap text-[11.5px] leading-relaxed text-slate">
              {TERMS_OF_USE}
              {'\n\n'}
              {COMMUNITY_GUIDELINES}
            </pre>
          </div>
        )}

        <div className="mt-auto flex flex-col gap-2.5 pb-8 pt-10">
          <button
            type="button"
            onClick={agree}
            disabled={submitting}
            className="flex h-[54px] items-center justify-center rounded-full bg-ink text-[15px] font-bold text-white disabled:opacity-40"
          >
            {submitting ? 'Saving…' : 'I agree — continue'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="flex h-[44px] items-center justify-center text-[13px] font-semibold text-slate"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  )
}
