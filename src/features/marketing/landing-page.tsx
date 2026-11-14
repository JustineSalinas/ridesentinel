import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Check, Download, Lock, Plus, ShieldAlert } from 'lucide-react'
import { BrandMark } from '@/components/brand-mark'
import { PhoneMock } from '@/components/phone-mock'
import { buttonVariants } from '@/components/ui/button-variants'
import { cn } from '@/lib/utils'
import { useScrollReveal } from '@/hooks/use-scroll-reveal'
import { DemoQuickAccess } from './demo-quick-access'
import { HandshakePreview } from './handshake-preview'

const STEPS = [
  {
    moment: 'Before pickup',
    title: 'Get ID-verified',
    body: 'Upload a government or school ID and a selfie. An admin reviews it manually, usually within 24 hours.',
  },
  {
    moment: 'At the curb',
    title: 'Show or scan a 60s QR',
    body: 'One rider displays a rotating single-use code and the other scans it with their camera.',
  },
  {
    moment: 'Face-to-face',
    title: 'Confirm the person',
    body: 'Both riders check the verified photo on screen and tap to confirm they are meeting the right rider.',
  },
  {
    moment: 'Within 48 hours',
    title: 'Rate blindly',
    body: 'Leave a rating after the ride. Scores stay locked until both submit or the 48-hour window closes.',
  },
] as const

const PRIVACY_FACTS = [
  'No ID numbers extracted or stored (zero OCR)',
  'ID photos and selfies auto-purged 30 days after review',
  'No GPS tracking, trip logging, or ride payments',
] as const

const FAQ = [
  [
    'Is this a ride-hailing app?',
    "No. There's no matching, booking, pricing, or payment. You still arrange the ride yourselves — RideSentinel only confirms who you're meeting at pickup.",
  ],
  [
    'What happens to my ID photo?',
    'Nothing is read from it automatically — a human administrator reviews it to verify your account, and the image is deleted 30 days after that decision either way.',
  ],
  [
    "What if the person doesn't match their photo?",
    'Tap "Not the same person" or cancel on the spot and file a report. No meeting gets counted, and the report goes straight to an administrator.',
  ],
  [
    'Who sees my rating?',
    "Nobody, until you both rate each other or 48 hours pass — whichever comes first. You can't see theirs by submitting yours early.",
  ],
  [
    'Can I delete my account?',
    'Yes, anytime from your profile. Your personal data is removed while past ratings remain anonymized so other riders’ scores stay accurate.',
  ],
] as const

export function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const reduceMotion = useReducedMotion()
  const stepsRef = useScrollReveal<HTMLOListElement>()
  const rulesRef = useScrollReveal<HTMLDivElement>()
  const faqRef = useScrollReveal<HTMLDivElement>()

  return (
    <div className="min-h-dvh bg-ink font-marketing text-white">
      {/* Top navigation */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-ink/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 md:px-10">
          <Link to="/" aria-label="RideSentinel home">
            <BrandMark showPilotTag />
          </Link>

          <nav className="hidden items-center gap-7 text-[13.5px] font-semibold text-slate-300 md:flex">
            <a href="#how-it-works" className="transition-colors hover:text-white">
              How it works
            </a>
            <a href="#rules" className="transition-colors hover:text-white">
              The rules
            </a>
            <a href="#faq" className="transition-colors hover:text-white">
              FAQ
            </a>
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="whitespace-nowrap px-2 py-1.5 text-[13.5px] font-semibold text-slate-200 transition-colors hover:text-white sm:px-3"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-brand px-3.5 text-[13.5px] font-bold text-white transition-colors hover:bg-brand-dark sm:px-4"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* First viewport — Curbside Signal opening */}
      <section className="border-b border-white/10 bg-ink px-5 pb-14 pt-10 md:px-10 md:pb-20 md:pt-14">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
          >
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-slate-200">
                <span className="h-2 w-2 rounded-full bg-green-400" aria-hidden="true" />
                Iloilo Pilot · Jaro · La Paz · Mandurriao
              </div>

              <h1 className="font-display mt-5 text-[40px] font-extrabold leading-[1.01] tracking-[-0.03em] text-white sm:text-[52px] lg:text-[62px]">
                Know who you&apos;re meeting before you ride.
              </h1>
            </div>

            <div className="flex max-w-md flex-col gap-5 lg:pb-1">
              <p className="text-[15.5px] leading-relaxed text-slate-300">
                Informal motorcycle rides get arranged in group chats, leaving both people guessing at
                pickup. RideSentinel verifies both riders with a photo ID check, a 60-second QR handshake,
                and blind ratings.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/register"
                  className={cn(
                    buttonVariants({ variant: 'primary', size: 'lg' }),
                    'rounded-xl px-6 shadow-sm',
                  )}
                >
                  Register for the pilot
                  <ArrowRight size={16} strokeWidth={2.2} />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex h-[52px] items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-5 text-[14.5px] font-bold text-white transition-colors hover:border-white/25 hover:bg-white/[0.08]"
                >
                  Log in
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Unified Curbside Signal Deck — flat signal-blue field + interactive live handshake */}
          <div className="mt-10 grid overflow-hidden rounded-2xl border border-white/15 bg-[#0B1120] lg:mt-12 lg:grid-cols-[0.88fr_1.12fr]">
            <div className="flex flex-col bg-brand p-6 text-white sm:p-8 lg:p-10">
              <div className="font-mono text-xs font-bold uppercase tracking-wider text-blue-50">
                Pickup handshake protocol
              </div>
              <h2 className="font-display mt-3 text-[26px] font-bold leading-[1.12] tracking-tight text-white sm:text-[30px]">
                Two phones, one live token, zero guesswork at the curb.
              </h2>
              <p className="mt-3 max-w-md text-[14.5px] leading-relaxed text-blue-50">
                Click through the three screens on the right to see the flow. In the real app, every
                check runs against server state — never screenshots or client claims.
              </p>

              <dl className="mt-10 grid grid-cols-3 divide-x divide-white/25 border-t border-white/25 pt-6 tabular-nums">
                <div className="pr-3">
                  <dt className="font-mono text-[24px] font-bold leading-none text-white sm:text-[28px]">
                    60s
                  </dt>
                  <dd className="mt-1.5 text-xs leading-snug text-blue-50">Single-use QR expiry</dd>
                </div>
                <div className="px-3">
                  <dt className="font-mono text-[24px] font-bold leading-none text-white sm:text-[28px]">
                    2/2
                  </dt>
                  <dd className="mt-1.5 text-xs leading-snug text-blue-50">Mutual face confirm</dd>
                </div>
                <div className="pl-3">
                  <dt className="font-mono text-[24px] font-bold leading-none text-white sm:text-[28px]">
                    48h
                  </dt>
                  <dd className="mt-1.5 text-xs leading-snug text-blue-50">Blind rating lock</dd>
                </div>
              </dl>
            </div>

            <div className="flex items-center justify-center border-t border-white/15 bg-[#0B1120] py-8 lg:border-l lg:border-t-0 lg:py-10">
              <PhoneMock>
                <HandshakePreview embedded />
              </PhoneMock>
            </div>
          </div>
        </div>
      </section>

      {/* Band 1: Unbroken horizontal 4-step pickup sequence */}
      <section id="how-it-works" className="border-b border-mist bg-paper px-5 py-14 text-ink md:px-10 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <h2 className="font-display text-[28px] font-bold tracking-tight text-ink md:text-[34px]">
              How pickup verification works.
            </h2>
            <p className="max-w-sm text-[14px] leading-snug text-slate">
              Same workflow whether you drive or ride as a passenger — both sides confirm before a ride
              counts.
            </p>
          </div>

          <ol
            ref={stepsRef}
            className="mt-8 grid grid-cols-1 divide-y divide-mist border-y border-mist sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x"
          >
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className={cn(
                  'py-6 sm:px-5 lg:py-7 lg:first:pl-0 lg:last:pr-0',
                  index < 2 && 'sm:border-b sm:border-mist lg:border-b-0',
                  index % 2 === 0 && 'sm:border-r sm:border-mist sm:pl-0 lg:border-r-0 lg:pl-5',
                  index % 2 === 1 && 'sm:pr-0 lg:pr-5',
                )}
              >
                <div className="font-mono text-xs font-semibold text-brand">{step.moment}</div>
                <h3 className="font-display mt-2 text-[18px] font-bold tracking-tight text-ink">
                  {step.title}
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed text-slate">{step.body}</p>
              </li>
            ))}
          </ol>

          {/* Honest scope boundary notice */}
          <div className="mt-8 flex flex-col gap-3 rounded-xl border border-mist bg-page px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <ShieldAlert size={18} className="mt-0.5 flex-shrink-0 text-amber-700" />
              <p className="max-w-[52ch] text-[13.5px] leading-snug text-slate">
                <strong className="font-bold text-ink">Not a ride-hailing app.</strong> There is no
                matching, booking, GPS tracking, or payment — you still arrange rides yourselves.
                &ldquo;ID-verified&rdquo; means an admin checked a government or school ID; it is not a
                background check or safety guarantee.
              </p>
            </div>
            <Link
              to="/consent"
              className="inline-flex flex-shrink-0 items-center gap-1 text-[13.5px] font-bold text-brand hover:text-brand-dark"
            >
              Privacy &amp; Terms <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* Band 2: Specification Ledger — Server-enforced rules + privacy posture */}
      <section id="rules" className="border-b border-mist bg-page px-5 py-14 text-ink md:px-10 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="flex flex-col justify-between">
            <div>
              <h2 className="font-display text-[28px] font-bold leading-tight tracking-tight text-ink md:text-[34px]">
                Chat groups don&apos;t verify faces. Screenshots don&apos;t prove presence.
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-slate">
                Arranging a ride over a group chat means showing up to meet someone you have never seen. A
                verified name and a photo you can compare in person fixes that — and tying ratings to a
                live QR scan keeps scores grounded in real trips.
              </p>
            </div>

            <div className="mt-8 border-t border-mist pt-6">
              <div className="text-[13.5px] font-bold text-ink">Data minimization by default</div>
              <ul className="mt-3 space-y-2.5">
                {PRIVACY_FACTS.map((fact) => (
                  <li key={fact} className="flex items-start gap-2.5 text-[14px] text-ink">
                    <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-800">
                      <Check size={11} strokeWidth={2.6} />
                    </span>
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Three server rules — clean specification ledger rows instead of card sprawl */}
          <div ref={rulesRef} className="divide-y divide-mist border-y border-mist bg-paper px-6">
            <div className="py-6">
              <div className="flex items-center justify-between gap-4">
                <span className="font-mono text-xs font-bold text-brand">Rule 01 · Token expiry</span>
                <span className="shrink-0 whitespace-nowrap rounded-md bg-page px-2.5 py-0.5 font-mono text-xs font-bold text-ink">
                  TTL = 60s
                </span>
              </div>
              <h3 className="font-display mt-2 text-[18px] font-bold text-ink">
                QR codes expire and cannot be replayed
              </h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-slate">
                Every nonce is single-use and rotates automatically before it expires. Forwarding a
                screenshot from earlier in the day fails server validation.
              </p>
            </div>

            <div className="py-6">
              <div className="flex items-center justify-between gap-4">
                <span className="font-mono text-xs font-bold text-brand">Rule 02 · Handshake gate</span>
                <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md bg-green-100 px-2.5 py-0.5 font-mono text-xs font-bold text-green-800">
                  <Lock size={11} />
                  2 / 2 confirm
                </span>
              </div>
              <h3 className="font-display mt-2 text-[18px] font-bold text-ink">
                No rating without a mutually confirmed meeting
              </h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-slate">
                The scanner confirms first, then the QR holder receives a live prompt to confirm. Ratings
                stay sealed until both rate or 48 hours elapse, preventing retaliatory scoring.
              </p>
            </div>

            <div className="py-6">
              <div className="flex items-center justify-between gap-4">
                <span className="font-mono text-xs font-bold text-brand">Rule 03 · Server authority</span>
                <span className="shrink-0 whitespace-nowrap rounded-md bg-page px-2.5 py-0.5 font-mono text-xs font-bold text-ink">
                  Client trust = 0
                </span>
              </div>
              <h3 className="font-display mt-2 text-[18px] font-bold text-ink">
                The server decides tier, badge, and rating visibility
              </h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-slate">
                Verification status, daily interaction caps, and score reveal logic run strictly inside
                authenticated backend functions with an immutable admin audit log.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Band 3: FAQ */}
      <section id="faq" className="bg-paper px-5 py-14 text-ink md:px-10 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
          <div>
            <h2 className="font-display text-[28px] font-bold tracking-tight text-ink md:text-[32px]">
              Straight answers before you join.
            </h2>
            <p className="mt-3 text-[14.5px] leading-relaxed text-slate">
              Pilot scope covers commuters and motorcycle riders around Jaro, La Paz, and Mandurriao in
              Iloilo City.
            </p>
          </div>

          <div ref={faqRef} className="divide-y divide-mist border-y border-mist">
            {FAQ.map(([q, a], i) => {
              const open = openFaq === i
              return (
                <div key={q} className="py-4">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="flex w-full items-center justify-between gap-4 text-left"
                    aria-expanded={open}
                  >
                    <span className="text-[15.5px] font-bold text-ink md:text-[16.5px]">{q}</span>
                    <Plus
                      size={18}
                      className={cn(
                        'flex-shrink-0 text-slate transition-transform duration-200',
                        open && 'rotate-45 text-ink',
                      )}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.p
                        initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                        transition={{ duration: 0.18 }}
                        className="overflow-hidden pt-2 text-[14.5px] leading-relaxed text-slate"
                      >
                        {a}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Closing bar */}
      <section className="border-t border-white/10 bg-ink px-5 py-12 text-white md:px-10 md:py-16">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="font-display text-[26px] font-bold tracking-tight md:text-[32px]">
              Takes a day to verify. Takes a minute at pickup.
            </h2>
            <p className="mt-1.5 text-[14.5px] text-slate-300">
              Create your pilot account now or sign in to view your verification status.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row">
            <Link
              to="/register"
              className={cn(buttonVariants({ variant: 'primary', size: 'lg' }), 'rounded-xl px-6')}
            >
              Register
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/login"
              className="inline-flex h-[52px] items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-6 text-[14.5px] font-bold text-white transition-colors hover:border-white/25 hover:bg-white/[0.08]"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>

      <DemoQuickAccess />

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#0B1120] px-5 py-8 text-slate-300 md:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] font-semibold">
            <Link to="/consent" className="transition-colors hover:text-white">
              Privacy &amp; Terms
            </Link>
            <Link to="/report" className="transition-colors hover:text-white">
              Report something
            </Link>
            <Link to="/admin" className="transition-colors hover:text-white">
              Admin
            </Link>
            <a
              href="/ridesentinel.apk"
              download
              className="inline-flex items-center gap-1.5 transition-colors hover:text-white"
            >
              <Download size={13} strokeWidth={2.2} />
              Download Android app
            </a>
          </div>
          <div className="font-mono text-xs text-slate-300">
            RideSentinel · Pilot — Jaro / La Paz / Mandurriao, Iloilo City
          </div>
        </div>
      </footer>
    </div>
  )
}
