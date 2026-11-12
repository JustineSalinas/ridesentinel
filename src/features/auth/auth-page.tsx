import { useEffect, useRef, useState } from 'react'
import { useAuthActions } from '@convex-dev/auth/react'
import { useConvexAuth, useMutation } from 'convex/react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Bike, Eye, EyeOff, UserRound } from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import { BrandMark } from '@/components/brand-mark'
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

/** Polls until `ref.current` is true, or throws after a timeout. */
async function waitUntil(ref: React.RefObject<boolean>, timeoutMs = 4000, intervalMs = 50): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (!ref.current) {
    if (Date.now() > deadline) throw new Error('Timed out waiting for authentication')
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }
}

const fieldClass =
  'h-11 w-full rounded-xl border border-white/15 bg-white/[0.04] px-3.5 text-[15px] text-white placeholder-slate-400 transition-colors focus:border-brand focus:bg-white/[0.07] focus:outline-none'
const labelClass = 'text-[13px] font-semibold text-slate-200'

export function AuthPage({ initialTab = 'login' }: { initialTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab)
  const { signIn } = useAuthActions()
  const completeRegistration = useMutation(api.profiles.completeRegistration)
  const { isAuthenticated } = useConvexAuth()
  const isAuthenticatedRef = useRef(isAuthenticated)
  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated
  }, [isAuthenticated])
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const [searchParams] = useSearchParams()

  const [email, setEmail] = useState(() => searchParams.get('email') ?? '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showResetHint, setShowResetHint] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [rideRole, setRideRole] = useState<'driver' | 'passenger'>('driver')
  const [phone, setPhone] = useState('')
  const [confirmedAdult, setConfirmedAdult] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function switchTab(next: Tab) {
    setTab(next)
    setError(null)
    setShowResetHint(false)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signIn('password', { email, password, flow: 'signIn' })
      // `signIn` resolving doesn't mean RequireAuth's `useConvexAuth()` has
      // re-rendered with `isAuthenticated: true` yet — that's a separate,
      // slightly-later reactive update. Navigating to /home immediately
      // can land RequireAuth's check before that update lands, silently
      // bouncing back to /login with no error shown. Wait for the exact
      // value RequireAuth itself reads before navigating.
      await waitUntil(isAuthenticatedRef)
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
    <div className="min-h-dvh bg-ink font-marketing text-white">
      <div className="mx-auto flex min-h-dvh w-full max-w-[460px] flex-col justify-between px-6 py-8 md:py-12">
        <div className="flex items-center justify-between">
          <Link to="/" aria-label="RideSentinel home">
            <BrandMark showPilotTag />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-300 transition-colors hover:text-white"
          >
            <ArrowLeft size={14} />
            Home
          </Link>
        </div>

        <motion.main
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="my-auto py-8"
        >
          <h1 className="font-display text-[30px] font-bold leading-tight tracking-tight text-white">
            {tab === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="mt-1.5 text-[14.5px] text-slate-300">
            {tab === 'login'
              ? 'Log in to show your QR or scan before pickup.'
              : "A verified photo is how the other rider knows it's really you."}
          </p>

          {/* Crisp segmented control */}
          <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl border border-white/15 bg-white/[0.04] p-1">
            <button
              type="button"
              onClick={() => switchTab('login')}
              className={cn(
                'rounded-lg py-2 text-[13.5px] font-bold transition-colors',
                tab === 'login'
                  ? 'bg-paper text-ink shadow-sm'
                  : 'text-slate-300 hover:text-white',
              )}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => switchTab('register')}
              className={cn(
                'rounded-lg py-2 text-[13.5px] font-bold transition-colors',
                tab === 'register'
                  ? 'bg-paper text-ink shadow-sm'
                  : 'text-slate-300 hover:text-white',
              )}
            >
              Register
            </button>
          </div>

          {error && (
            <div
              className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] font-medium text-red-200"
              role="alert"
            >
              {error}
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="mt-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="login-email" className={labelClass}>
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  autoFocus={!searchParams.get('email')}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={fieldClass}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password" className={labelClass}>
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowResetHint((v) => !v)}
                    className="text-[12.5px] font-semibold text-blue-400 transition-colors hover:text-blue-300"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="current-password"
                    autoFocus={!!searchParams.get('email')}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn(fieldClass, 'pr-11')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-300 transition-colors hover:text-white"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {showResetHint && (
                <div className="rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-2.5 text-[13px] leading-snug text-slate-200">
                  Automated email resets are disabled during the Iloilo pilot. Contact a pilot admin at{' '}
                  <span className="font-mono text-white">privacy@ridesentinel.app</span> for account help.
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className={cn(
                  buttonVariants({ variant: 'primary', size: 'lg' }),
                  'mt-1 w-full rounded-xl disabled:opacity-60',
                )}
              >
                {submitting ? 'Logging in…' : 'Log in'}
              </button>

              <p className="text-center text-xs text-slate-300">
                Requires an active data connection — QR codes are verified live on the server.
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="mt-6 flex flex-col gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="register-name" className={labelClass}>
                  Display name
                </label>
                <input
                  id="register-name"
                  required
                  autoFocus
                  autoComplete="name"
                  minLength={2}
                  maxLength={60}
                  placeholder="e.g. Marco D."
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={fieldClass}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="register-email" className={labelClass}>
                  Email
                </label>
                <input
                  id="register-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={fieldClass}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="register-password" className={labelClass}>
                  Password
                </label>
                <div className="relative">
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn(fieldClass, 'pr-11')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-300 transition-colors hover:text-white"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="register-phone" className={labelClass}>
                  Phone <span className="font-normal text-slate-300">(optional)</span>
                </label>
                <input
                  id="register-phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+63 9xx xxx xxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={fieldClass}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className={labelClass}>I usually ride as</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRideRole('driver')}
                    aria-pressed={rideRole === 'driver'}
                    className={cn(
                      'flex items-center justify-center gap-2 rounded-xl border py-2.5 text-[13.5px] font-bold transition-colors',
                      rideRole === 'driver'
                        ? 'border-brand bg-brand/15 text-white'
                        : 'border-white/15 bg-white/[0.03] text-slate-300 hover:border-white/30 hover:text-white',
                    )}
                  >
                    <Bike size={15} />
                    Driver
                  </button>
                  <button
                    type="button"
                    onClick={() => setRideRole('passenger')}
                    aria-pressed={rideRole === 'passenger'}
                    className={cn(
                      'flex items-center justify-center gap-2 rounded-xl border py-2.5 text-[13.5px] font-bold transition-colors',
                      rideRole === 'passenger'
                        ? 'border-brand bg-brand/15 text-white'
                        : 'border-white/15 bg-white/[0.03] text-slate-300 hover:border-white/30 hover:text-white',
                    )}
                  >
                    <UserRound size={15} />
                    Passenger
                  </button>
                </div>
              </div>

              <label className="mt-1 flex cursor-pointer items-start gap-2.5 rounded-xl border border-white/15 bg-white/[0.03] px-3.5 py-3 text-[13px] leading-snug text-slate-200">
                <input
                  type="checkbox"
                  checked={confirmedAdult}
                  onChange={(e) => setConfirmedAdult(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-brand"
                />
                <span>I confirm that I am 18 years of age or older.</span>
              </label>

              <button
                type="submit"
                disabled={submitting || !confirmedAdult}
                className={cn(
                  buttonVariants({ variant: 'primary', size: 'lg' }),
                  'mt-1 w-full rounded-xl disabled:opacity-50',
                )}
              >
                {submitting ? 'Creating account…' : 'Create account'}
              </button>
            </form>
          )}
        </motion.main>

        <footer className="font-mono text-xs text-slate-300">
          Pilot area · Jaro / La Paz / Mandurriao, Iloilo City
        </footer>
      </div>
    </div>
  )
}
