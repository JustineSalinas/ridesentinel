import { useState } from 'react'
import { useAuthActions } from '@convex-dev/auth/react'
import { useMutation } from 'convex/react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Shield, QrCode, UserCheck } from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button-variants'

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

const fieldClass =
  'neu-dark-in h-12 rounded-xl px-3.5 text-[15px] text-white placeholder-white/30 outline-none'
const labelClass = 'text-[13px] font-semibold text-white/70'

export function AuthPage({ initialTab = 'login' }: { initialTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab)
  const { signIn } = useAuthActions()
  const completeRegistration = useMutation(api.profiles.completeRegistration)
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()

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
    <div className="flex min-h-dvh flex-col bg-ink md:flex-row">
      {/* Left — form */}
      <div className="flex w-full flex-col justify-center px-7 py-10 md:w-[480px] md:flex-shrink-0 md:px-14 lg:w-[520px]">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <div className="flex items-center gap-2.5">
            <div className="neu-brand flex h-10 w-10 items-center justify-center rounded-xl">
              <Shield size={18} strokeWidth={2.2} className="text-white" fill="#FFFFFF" />
            </div>
            <span className="text-[15px] font-extrabold tracking-tight text-white">RideSentinel</span>
          </div>

          <h1 className="mt-9 text-[26px] font-extrabold leading-tight tracking-tight text-white">
            {tab === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="mt-1.5 text-[14px] text-white/50">
            {tab === 'login'
              ? 'Log in to confirm who you ride with.'
              : "A verified photo is how the other person knows it's really you."}
          </p>

          <div className="neu-dark-in mt-7 flex gap-1 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setTab('login')}
              className={cn(
                'flex-1 rounded-lg py-2.5 text-sm font-semibold text-white/50 transition-colors',
                tab === 'login' && 'neu-dark-out text-white',
              )}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => setTab('register')}
              className={cn(
                'flex-1 rounded-lg py-2.5 text-sm font-semibold text-white/50 transition-colors',
                tab === 'register' && 'neu-dark-out text-white',
              )}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-[13px] text-red-300" role="alert">
              {error}
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="mt-6 flex flex-col gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className={labelClass}>
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
                  className={fieldClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className={labelClass}>
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
                  className={fieldClass}
                />
              </div>
              <a href="#" className="-mt-1 self-end text-[13px] text-brand">
                Forgot password?
              </a>
              <button
                type="submit"
                disabled={submitting}
                className={cn(buttonVariants({ variant: 'heroPrimary', size: 'lg' }), 'mt-2 disabled:opacity-60')}
              >
                {submitting ? 'Logging in…' : 'Log in'}
              </button>
              <div className="mt-1 text-center text-[12.5px] text-white/30">
                A data connection is required — RideSentinel does not work offline.
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="mt-6 flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Display name</label>
                <input
                  required
                  autoFocus
                  minLength={2}
                  maxLength={60}
                  placeholder="e.g. Marco D."
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={fieldClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={fieldClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={fieldClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Phone (optional)</label>
                <input
                  type="tel"
                  placeholder="+63 9xx xxx xxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={fieldClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>I usually ride as</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRideRole('driver')}
                    className={cn(
                      'flex-1 rounded-xl border-2 py-2.5 text-sm font-semibold transition-colors',
                      rideRole === 'driver'
                        ? 'border-brand bg-brand/15 text-white'
                        : 'neu-dark-out-sm border-transparent text-white/60',
                    )}
                  >
                    Driver
                  </button>
                  <button
                    type="button"
                    onClick={() => setRideRole('passenger')}
                    className={cn(
                      'flex-1 rounded-xl border-2 py-2.5 text-sm font-semibold transition-colors',
                      rideRole === 'passenger'
                        ? 'border-brand bg-brand/15 text-white'
                        : 'neu-dark-out-sm border-transparent text-white/60',
                    )}
                  >
                    Passenger
                  </button>
                </div>
              </div>
              <label className="mt-1 flex items-start gap-2.5 text-[12.5px] leading-tight text-white/50">
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
                className={cn(buttonVariants({ variant: 'heroPrimary', size: 'lg' }), 'mt-1 disabled:opacity-60')}
              >
                {submitting ? 'Creating account…' : 'Create account'}
              </button>
            </form>
          )}
        </motion.div>
      </div>

      {/* Right — brand panel, desktop only */}
      <div className="relative hidden flex-1 overflow-hidden bg-gradient-to-br from-brand to-brand-dark md:flex md:flex-col md:justify-between md:p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, #fff 0 1px, transparent 1px 32px), repeating-linear-gradient(90deg, #fff 0 1px, transparent 1px 32px)',
          }}
          aria-hidden="true"
        />

        <div />

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="relative mx-auto flex w-full max-w-[340px] flex-col items-center gap-4"
        >
          <div className="w-full rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-mist pb-3">
              <div className="h-9 w-9 rounded-full bg-mist" />
              <div>
                <div className="text-[13px] font-bold text-ink">Marco D.</div>
                <div className="flex items-center gap-1 text-[10.5px] font-bold text-verified">
                  <UserCheck size={11} strokeWidth={2.2} />
                  ID-verified
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-center rounded-xl bg-ink py-6">
              <QrCode size={64} strokeWidth={1.3} className="text-white" />
            </div>
            <div className="mt-3 rounded-full bg-mist py-1.5 text-center text-[11px] font-bold text-slate">
              Refreshes in 42s
            </div>
          </div>
        </motion.div>

        <div className="relative text-center text-white">
          <p className="text-[17px] font-bold leading-snug">
            &ldquo;Know who you&apos;re meeting, before you ride.&rdquo;
          </p>
          <p className="mt-1.5 text-[12.5px] text-white/60">RideSentinel pilot — Iloilo City</p>
        </div>
      </div>
    </div>
  )
}
