import { useState } from 'react'
import { useMutation } from 'convex/react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../../convex/_generated/api'
import { TERMS_OF_USE, COMMUNITY_GUIDELINES, PILOT_COMMUNITY_NAME, DATA_PROTECTION_CONTACT } from './terms'

const POINTS = [
  [
    'What we collect',
    'Your name, an ID photo, and a selfie. No ID number, ever. No location, ever.',
  ],
  [
    'Who sees it',
    'Only a named administrator reviews your ID. Other riders only ever see your name, photo, tier, and rating.',
  ],
  [
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
    <div className="flex min-h-dvh flex-col bg-page">
      <div className="border-b border-mist bg-paper px-6 py-5">
        <div className="text-[11px] font-bold uppercase tracking-widest text-slate">
          Before you continue
        </div>
        <h1 className="mt-1 text-[21px] font-extrabold tracking-tight text-ink">
          Your data &amp; consent
        </h1>
      </div>

      <div className="flex flex-1 flex-col px-6 py-6">
        <div className="flex flex-col gap-3">
          {POINTS.map(([title, body]) => (
            <div key={title} className="rounded-[14px] border border-mist bg-paper p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M12 2L4 6v6c0 5.5 3.5 8.5 8 10 4.5-1.5 8-4.5 8-10V6l-8-4z"
                    stroke="#2563EB"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="mt-2.5 text-[15px] font-bold text-ink">{title}</div>
              <div className="mt-0.5 text-[13px] leading-snug text-slate">{body}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-[12.5px] leading-snug text-[#92400E]">
          <span className="font-bold">A badge is not a safety guarantee.</span> RideSentinel
          doesn&apos;t arrange, price, or operate rides &mdash; you&apos;re responsible for your own
          judgment and conduct.
        </div>

        <p className="mt-4 text-[13px] leading-snug text-slate">
          By continuing you agree to our{' '}
          <button type="button" onClick={() => setShowTerms((v) => !v)} className="font-semibold text-brand">
            Terms of Use and Community Guidelines
          </button>
          .
        </p>

        {showTerms && (
          <div className="mt-3 max-h-[220px] overflow-y-auto rounded-xl border border-mist bg-mist/40 p-4">
            <pre className="whitespace-pre-wrap text-[11.5px] leading-relaxed text-slate">
              {TERMS_OF_USE}
              {'\n\n'}
              {COMMUNITY_GUIDELINES}
            </pre>
          </div>
        )}

        <div className="mt-4 text-[11.5px] leading-snug text-slate">
          {PILOT_COMMUNITY_NAME} · Questions about your data:{' '}
          <a href={`mailto:${DATA_PROTECTION_CONTACT}`} className="font-semibold text-brand">
            {DATA_PROTECTION_CONTACT}
          </a>
        </div>
      </div>

      <div className="sticky bottom-0 flex flex-col gap-2 border-t border-mist bg-paper px-6 py-4">
        <button
          type="button"
          onClick={agree}
          disabled={submitting}
          className="flex h-[52px] items-center justify-center rounded-xl bg-brand text-[16px] font-bold text-white disabled:opacity-60"
        >
          {submitting ? 'Saving…' : 'I agree — continue'}
        </button>
        <button
          type="button"
          onClick={() => navigate('/home')}
          className="flex h-11 items-center justify-center text-[13px] font-semibold text-slate"
        >
          Not now
        </button>
      </div>
    </div>
  )
}
