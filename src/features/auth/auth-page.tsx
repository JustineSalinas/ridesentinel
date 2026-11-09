import { useState } from 'react'
import { useAuthActions } from '@convex-dev/auth/react'
import { useMutation } from 'convex/react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../../convex/_generated/api'
import { cn } from '@/lib/utils'

type Tab = 'login' | 'register'

export function AuthPage({ initialTab = 'login' }: { initialTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab)
  const { signIn } = useAuthActions()
  const completeRegistration = useMutation(api.profiles.completeRegistration)
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [rideRole, setRideRole] = useState<'driver' | 'passenger'>('driver')
  const [phone, setPhone] = useState('')
  const [confirmedAdult, setConfirmedAdult] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signIn('password', { email, password, flow: 'signIn' })
      navigate('/home')
    } catch {
      setError('Incorrect email or password.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!confirmedAdult) return
    setSubmitting(true)
    try {
      await signIn('password', { email, password, flow: 'signUp' })
      await completeRegistration({ displayName, rideRole, phone: phone || undefined })
      navigate('/consent')
    } catch {
      setError('Could not create your account. The email may already be in use.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-ink">
      {/* Night-ride hero — the thing a lending/checklist app would never use, which is the point */}
      <div className="relative overflow-hidden px-7 pb-14 pt-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, #fff 0 1px, transparent 1px 28px), repeating-linear-gradient(90deg, #fff 0 1px, transparent 1px 28px)',
          }}
          aria-hidden="true"
        />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold tracking-[0.18em] text-pending">
            <span className="h-1.5 w-1.5 rounded-full bg-pending" />
            PILOT · ILOILO CITY
          </div>
          <Link to="/" className="font-mono text-[11px] font-bold tracking-wide text-slate-400">
            ← BACK
          </Link>
        </div>
        <h1 className="relative mt-3 text-[34px] font-extrabold leading-[1.05] tracking-tight text-white">
          Ride<span className="text-brand">Sentinel</span>
        </h1>
        <p className="relative mt-2 max-w-[260px] text-[13.5px] leading-snug text-slate-300">
          Know who you&apos;re meeting, before the ride starts.
        </p>
        <div className="relative mt-6 flex items-center gap-2 text-slate-500">
          <div className="h-px flex-1 bg-[repeating-linear-gradient(90deg,currentColor_0_6px,transparent_6px_12px)]" />
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
        </div>
      </div>

      {/* Content sheet rises over the hero */}
      <div className="-mt-6 flex flex-1 flex-col rounded-t-[28px] bg-paper px-7 pt-8">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[21px] font-extrabold tracking-tight text-ink">
            {tab === 'login' ? 'Log in' : 'Create account'}
          </h2>
          <button
            type="button"
            onClick={() => setTab(tab === 'login' ? 'register' : 'login')}
            className="font-mono text-[11px] font-bold tracking-wide text-brand-dark underline-offset-2 hover:underline"
          >
            {tab === 'login' ? 'NEW RIDER →' : '← LOG IN'}
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-danger">
            <span className="mt-[2px] font-mono text-[10px] font-bold tracking-wide">ERR</span>
            {error}
          </div>
        )}

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="mt-6 flex flex-1 flex-col gap-5">
            <Field label="Email">
              <input
                type="email"
                required
                autoFocus
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-0 border-b-2 border-mist bg-transparent pb-2 text-[17px] font-medium text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand"
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                required
                minLength={8}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-0 border-b-2 border-mist bg-transparent pb-2 text-[17px] font-medium text-ink outline-none transition-colors focus:border-brand"
              />
            </Field>

            <SubmitButton submitting={submitting} label="Log in" submittingLabel="Logging in" />

            <div className="mt-auto flex items-center justify-center gap-1.5 pb-8 pt-2 font-mono text-[10.5px] font-bold tracking-widest text-slate-400">
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              NO SIGNAL · NO ACCESS
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="mt-6 flex flex-1 flex-col gap-5 pb-8">
            <Field label="Display name">
              <input
                required
                autoFocus
                minLength={2}
                maxLength={60}
                placeholder="e.g. Marco D."
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full border-0 border-b-2 border-mist bg-transparent pb-2 text-[17px] font-medium text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand"
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-0 border-b-2 border-mist bg-transparent pb-2 text-[17px] font-medium text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand"
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                required
                minLength={8}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-0 border-b-2 border-mist bg-transparent pb-2 text-[17px] font-medium text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand"
              />
            </Field>
            <Field label="Phone — optional">
              <input
                type="tel"
                placeholder="+63 9xx xxx xxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border-0 border-b-2 border-mist bg-transparent pb-2 text-[17px] font-medium text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand"
              />
            </Field>

            <div className="flex flex-col gap-2">
              <span className="font-mono text-[10.5px] font-bold uppercase tracking-widest text-slate-400">
                I usually ride as
              </span>
              <div className="flex gap-2">
                <RoleButton active={rideRole === 'driver'} onClick={() => setRideRole('driver')}>
                  Driver
                </RoleButton>
                <RoleButton active={rideRole === 'passenger'} onClick={() => setRideRole('passenger')}>
                  Passenger
                </RoleButton>
              </div>
            </div>

            <label className="flex items-start gap-2.5 text-[13px] leading-snug text-slate">
              <input
                type="checkbox"
                checked={confirmedAdult}
                onChange={(e) => setConfirmedAdult(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-ink"
              />
              I confirm that I am 18 years of age or older.
            </label>

            <SubmitButton
              submitting={submitting}
              disabled={!confirmedAdult}
              label="Create account"
              submittingLabel="Creating account"
            />
          </form>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-mono text-[10.5px] font-bold uppercase tracking-widest text-slate-400">
        {label}
      </span>
      {children}
    </div>
  )
}

function RoleButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 rounded-full py-2.5 text-sm font-bold transition-colors',
        active ? 'bg-ink text-white' : 'bg-mist text-slate',
      )}
    >
      {children}
    </button>
  )
}

function SubmitButton({
  submitting,
  disabled,
  label,
  submittingLabel,
}: {
  submitting: boolean
  disabled?: boolean
  label: string
  submittingLabel: string
}) {
  return (
    <button
      type="submit"
      disabled={submitting || disabled}
      className="group mt-1 flex h-[54px] items-center justify-between rounded-full bg-ink px-6 text-[15px] font-bold text-white transition-colors disabled:opacity-40"
    >
      {submitting ? submittingLabel + '…' : label}
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand transition-transform group-enabled:group-hover:translate-x-0.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M5 12h14M13 6l6 6-6 6"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>
  )
}
