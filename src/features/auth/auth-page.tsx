import { useState } from 'react'
import { useAuthActions } from '@convex-dev/auth/react'
import { useMutation } from 'convex/react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../../convex/_generated/api'
import { cn } from '@/lib/utils'

type Tab = 'login' | 'register'

async function retryOnUnauthenticated<T>(fn: () => Promise<T>, attempts = 5, delayMs = 200): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      if (i === attempts - 1 || !message.includes('UNAUTHENTICATED')) throw e
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
  throw new Error('unreachable')
}

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
      // `signIn` resolving doesn't guarantee the Convex client has finished
      // propagating the new auth token to its WebSocket connection yet — the
      // very next mutation call can race it and fail with UNAUTHENTICATED.
      // Retry briefly instead of failing a registration that actually worked.
      await retryOnUnauthenticated(() =>
        completeRegistration({ displayName, rideRole, phone: phone || undefined }),
      )
      navigate('/consent')
    } catch {
      setError('Could not create your account. The email may already be in use.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-page">
      <div className="flex flex-col items-center gap-2 px-7 pb-5 pt-14">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 2L3 7v6c0 5 4 8 9 9 5-1 9-4 9-9V7l-9-5z" fill="#FFFFFF" />
            <path
              d="M9 12l2 2 4-4"
              stroke="#2563EB"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="text-[21px] font-extrabold tracking-tight text-ink">RideSentinel</div>
        <div className="text-center text-[13px] text-slate">
          Know who you&apos;re meeting before you ride
        </div>
      </div>

      <div className="mx-6 flex gap-1 rounded-[10px] bg-mist p-1">
        <button
          type="button"
          onClick={() => setTab('login')}
          className={cn(
            'flex-1 rounded-lg py-2.5 text-sm font-semibold text-slate',
            tab === 'login' && 'bg-paper text-ink',
          )}
        >
          Log in
        </button>
        <button
          type="button"
          onClick={() => setTab('register')}
          className={cn(
            'flex-1 rounded-lg py-2.5 text-sm font-semibold text-slate',
            tab === 'register' && 'bg-paper text-ink',
          )}
        >
          Register
        </button>
      </div>

      {error && (
        <div className="mx-6 mt-4 rounded-xl bg-red-50 px-4 py-3 text-[13px] text-danger" role="alert">
          {error}
        </div>
      )}

      {tab === 'login' ? (
        <form onSubmit={handleLogin} className="flex flex-1 flex-col gap-3.5 px-6 py-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-[13px] font-semibold text-[#334155]">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-[10px] border border-[#CBD5E1] bg-paper px-3.5 text-[15px] text-ink"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-[13px] font-semibold text-[#334155]">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-[10px] border border-[#CBD5E1] bg-paper px-3.5 text-[15px] text-ink"
            />
          </div>
          <a href="#" className="-mt-1 self-end text-[13px] text-brand">
            Forgot password?
          </a>
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 flex h-[52px] items-center justify-center rounded-xl bg-brand text-[16px] font-bold text-white disabled:opacity-60"
          >
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
          <div className="mt-1 text-center text-[13px] text-slate">
            A data connection is required — RideSentinel does not work offline.
          </div>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="flex flex-1 flex-col gap-3 px-6 py-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#334155]">Display name</label>
            <input
              required
              autoFocus
              minLength={2}
              maxLength={60}
              placeholder="e.g. Marco D."
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="h-[46px] rounded-[10px] border border-[#CBD5E1] bg-paper px-3.5 text-[14px] text-ink"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#334155]">Email</label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-[46px] rounded-[10px] border border-[#CBD5E1] bg-paper px-3.5 text-[14px] text-ink"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#334155]">Password</label>
            <input
              type="password"
              required
              minLength={8}
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-[46px] rounded-[10px] border border-[#CBD5E1] bg-paper px-3.5 text-[14px] text-ink"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#334155]">Phone (optional)</label>
            <input
              type="tel"
              placeholder="+63 9xx xxx xxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-[46px] rounded-[10px] border border-[#CBD5E1] bg-paper px-3.5 text-[14px] text-ink"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#334155]">I usually ride as</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRideRole('driver')}
                className={cn(
                  'flex-1 rounded-[10px] border py-2.5 text-sm font-semibold',
                  rideRole === 'driver'
                    ? 'border-2 border-brand bg-blue-50 text-brand-dark'
                    : 'border-[#CBD5E1] bg-paper text-[#334155]',
                )}
              >
                Driver
              </button>
              <button
                type="button"
                onClick={() => setRideRole('passenger')}
                className={cn(
                  'flex-1 rounded-[10px] border py-2.5 text-sm font-semibold',
                  rideRole === 'passenger'
                    ? 'border-2 border-brand bg-blue-50 text-brand-dark'
                    : 'border-[#CBD5E1] bg-paper text-[#334155]',
                )}
              >
                Passenger
              </button>
            </div>
          </div>
          <label className="mt-1 flex items-start gap-2.5 text-[12.5px] leading-tight text-[#475569]">
            <input
              type="checkbox"
              checked={confirmedAdult}
              onChange={(e) => setConfirmedAdult(e.target.checked)}
              className="mt-0.5 h-4 w-4"
            />
            I confirm that I am 18 years of age or older.
          </label>
          <button
            type="submit"
            disabled={submitting || !confirmedAdult}
            className="mt-1 flex h-[52px] items-center justify-center rounded-xl bg-brand text-[16px] font-bold text-white disabled:opacity-60"
          >
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      )}
    </div>
  )
}
