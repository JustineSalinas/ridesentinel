import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowRight, Check, Download, Handshake, IdCard, Minus, Plus, ScanFace, ShieldAlert, X } from 'lucide-react'
import { BrandMark } from '@/components/brand-mark'
import { PhoneMock } from '@/components/phone-mock'
import { CountdownRing } from '@/components/countdown-ring'
import { AndroidGlyph, AppleGlyph } from '@/components/platform-icons'
import { buttonVariants } from '@/components/ui/button-variants'
import { cn } from '@/lib/utils'
import { useScrollReveal } from '@/hooks/use-scroll-reveal'
import { HandshakePreview } from './handshake-preview'

gsap.registerPlugin(ScrollTrigger)

// maplibre-gl is >1MB — only the footer needs it, so it must not block the
// landing page's initial bundle. Lazy-load it and let the footer's own
// gradient/background color stand in until it's ready.
const Map = lazy(() => import('@/components/ui/map').then((m) => ({ default: m.Map })))

const HEADLINE_LINES = ['Know who you’re meeting', 'before you ride.']

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

type Support = 'yes' | 'no' | 'partial'

const COMPARISON: { feature: string; groupChat: Support; rideHailing: Support; rideSentinel: Support }[] = [
  { feature: 'ID verified before you meet', groupChat: 'no', rideHailing: 'partial', rideSentinel: 'yes' },
  { feature: 'Face-to-face pickup confirmation', groupChat: 'no', rideHailing: 'no', rideSentinel: 'yes' },
  { feature: 'Mutual blind rating', groupChat: 'no', rideHailing: 'partial', rideSentinel: 'yes' },
  { feature: 'Works with rides you already arranged', groupChat: 'yes', rideHailing: 'no', rideSentinel: 'yes' },
  { feature: 'Booking, matching & in-app payment', groupChat: 'no', rideHailing: 'yes', rideSentinel: 'no' },
  { feature: 'GPS ride tracking', groupChat: 'no', rideHailing: 'yes', rideSentinel: 'no' },
] as const

function SupportMark({ value }: { value: Support }) {
  if (value === 'yes') {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-verified/15 text-verified">
        <Check size={14} strokeWidth={3} />
      </span>
    )
  }
  if (value === 'partial') {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-pending/15 text-pending">
        <Minus size={14} strokeWidth={3} />
      </span>
    )
  }
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-mist text-slate-400">
      <X size={14} strokeWidth={3} />
    </span>
  )
}

const FAQ = [
  [
    'Is this a ride-hailing app?',
    "No. There's no matching, booking, pricing, or payment. You still arrange the ride yourselves. RideSentinel only confirms who you're meeting at pickup.",
  ],
  [
    'What happens to my ID photo?',
    'A human administrator reviews it to verify your account, and the image is deleted 30 days after that decision either way. No ID number is ever read or stored.',
  ],
  [
    'Who sees my rating?',
    "Nobody, until you both rate each other or 48 hours pass, whichever comes first. You can't see theirs by submitting yours early.",
  ],
] as const

export function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const reduceMotion = useReducedMotion()
  const stepsRef = useScrollReveal<HTMLOListElement>()
  const faqRef = useScrollReveal<HTMLDivElement>()
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const phoneRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (reduceMotion) return
    const ctx = gsap.context(() => {
      if (headlineRef.current) {
        gsap.fromTo(
          headlineRef.current.querySelectorAll('[data-line]'),
          { opacity: 0, y: 28 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.09, delay: 0.05 },
        )
      }
      if (phoneRef.current) {
        gsap.to(phoneRef.current, {
          y: -36,
          ease: 'none',
          scrollTrigger: { trigger: phoneRef.current, start: 'top top', end: 'bottom top', scrub: 0.6 },
        })
      }
    })
    return () => ctx.revert()
  }, [reduceMotion])

  return (
    <div className="min-h-dvh bg-ink font-marketing text-white">
      {/* Top navigation */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-ink/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 md:px-10">
          <Link to="/" aria-label="RideSentinel home">
            <BrandMark />
          </Link>

          <nav className="hidden items-center gap-7 text-[13.5px] font-semibold text-slate-300 md:flex">
            <a href="#how-it-works" className="transition-colors hover:text-white">
              How it works
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

      {/* First viewport — asymmetric hero, phone bleeds past the content edge */}
      <section className="relative overflow-hidden bg-white px-5 pb-20 pt-14 text-ink md:px-10 md:pb-28 md:pt-20">
        {/* Dot-grid texture, not a blurred blob — reads as a signal grid, not stock decoration */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage: 'radial-gradient(circle, #CBD5E1 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            maskImage: 'radial-gradient(70% 60% at 78% 10%, black 0%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(70% 60% at 78% 10%, black 0%, transparent 75%)',
          }}
        />

        <div className="mx-auto grid max-w-6xl items-start gap-12 lg:grid-cols-[1fr_0.95fr] lg:gap-4">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="lg:pt-6"
          >
            <div className="border-l-2 border-brand pl-3 font-mono text-xs font-semibold uppercase tracking-wider text-slate">
              Service area: Iloilo City
              <span className="mx-1.5 text-ink/25">·</span>
              Jaro, La Paz, Mandurriao
            </div>

            <h1
              ref={headlineRef}
              className="font-display mt-5 text-[40px] font-extrabold leading-[1.03] tracking-[-0.03em] text-ink sm:text-[52px] lg:text-[58px]"
            >
              {HEADLINE_LINES.map((line) => (
                <span key={line} data-line className="block overflow-hidden">
                  {line}
                </span>
              ))}
            </h1>

            <p className="mt-5 max-w-md text-[15.5px] leading-relaxed text-slate">
              Informal motorcycle rides get arranged in group chats, leaving both people guessing at
              pickup. RideSentinel verifies both riders with a photo ID check, a 60-second QR handshake,
              and blind ratings.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                to="/register"
                className={cn(buttonVariants({ variant: 'primary', size: 'lg' }), 'rounded-xl px-6 shadow-sm')}
              >
                Register
                <ArrowRight size={16} strokeWidth={2.2} />
              </Link>
              <Link
                to="/login"
                className="inline-flex h-[52px] items-center justify-center gap-1.5 rounded-xl border border-ink/15 bg-white px-5 text-[14.5px] font-bold text-ink transition-colors hover:border-ink/25 hover:bg-mist"
              >
                Log in
              </Link>
            </div>

            <div className="mt-4 flex items-center gap-2.5 text-[12.5px] font-semibold text-slate">
              <a
                href="/ridesentinel.apk"
                download
                className="inline-flex items-center gap-1.5 text-ink transition-colors hover:text-brand"
              >
                <AndroidGlyph className="h-3.5 w-3.5" />
                Download for Android
              </a>
              <span className="text-ink/20">·</span>
              <span className="inline-flex items-center gap-1.5 text-slate-400">
                <AppleGlyph className="h-3.5 w-3.5" />
                iOS
                <span className="rounded-full bg-mist px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-slate">
                  Soon
                </span>
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.1 }}
            className="relative mx-auto lg:mx-0 lg:ml-auto lg:-mr-16 lg:translate-x-10"
          >
            <div ref={phoneRef} className="relative rotate-[8deg] transition-transform duration-500 hover:rotate-[2deg]">
              <PhoneMock className="relative z-10 h-[400px] w-auto sm:h-[440px] lg:h-[480px]">
                <HandshakePreview embedded />
              </PhoneMock>

              {/* Live QR expiry — a real ticking countdown, not a static badge */}
              <div className="absolute -right-3 -top-3 z-20 flex items-center gap-1.5 rounded-full border border-ink/10 bg-white py-1.5 pl-2 pr-3 shadow-lg">
                <CountdownRing className="h-6 w-6 text-brand" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate">
                  QR live
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Band 0: Pickup handshake protocol facts */}
      <section className="bg-brand px-5 py-10 text-white md:px-10 md:py-12">
        <div className="mx-auto max-w-6xl">
          <div className="font-mono text-xs font-bold uppercase tracking-wider text-blue-50">
            Pickup handshake protocol
          </div>
          <h2 className="font-display mt-2 max-w-2xl text-[22px] font-bold leading-[1.2] tracking-tight text-white sm:text-[26px]">
            Two phones, one live token, zero guesswork at the curb.
          </h2>

          <dl className="mt-7 grid grid-cols-1 gap-6 border-t border-white/25 pt-6 sm:grid-cols-3 sm:divide-x sm:divide-white/25 tabular-nums">
            <div className="sm:pr-5">
              <dt className="font-mono text-[26px] font-bold leading-none text-white sm:text-[30px]">
                60s
              </dt>
              <dd className="mt-1.5 text-xs leading-snug text-blue-50">Single-use QR expiry</dd>
            </div>
            <div className="sm:px-5">
              <dt className="font-mono text-[26px] font-bold leading-none text-white sm:text-[30px]">
                2/2
              </dt>
              <dd className="mt-1.5 text-xs leading-snug text-blue-50">Mutual face confirm</dd>
            </div>
            <div className="sm:pl-5">
              <dt className="font-mono text-[26px] font-bold leading-none text-white sm:text-[30px]">
                48h
              </dt>
              <dd className="mt-1.5 text-xs leading-snug text-blue-50">Blind rating lock</dd>
            </div>
          </dl>
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
              Same workflow whether you drive or ride as a passenger: both sides confirm before a ride
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
                matching, booking, GPS tracking, or payment. You still arrange rides yourselves.
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

      {/* Band 1.5: Honest comparison — what RideSentinel adds that the alternatives don't */}
      <section className="border-b border-mist bg-page px-5 py-14 text-ink md:px-10 md:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-display text-[28px] font-bold tracking-tight text-ink md:text-[34px]">
            Not a replacement for how you already ride: the missing trust layer.
          </h2>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-slate">
            RideSentinel isn&apos;t a ride-hailing app and doesn&apos;t try to be one. Here&apos;s how it compares
            to arranging rides in a group chat, and to a typical ride-hailing app, for the one moment that
            matters most: knowing who&apos;s actually showing up at pickup.
          </p>

          <div className="mt-8 overflow-x-auto rounded-xl border border-mist bg-paper">
            <table className="w-full min-w-[560px] border-collapse text-left text-[13.5px]">
              <thead>
                <tr className="border-b border-mist">
                  <th scope="col" className="px-5 py-4 font-semibold text-slate">
                    Feature
                  </th>
                  <th scope="col" className="px-4 py-4 text-center font-semibold text-slate">
                    Group chat
                  </th>
                  <th scope="col" className="px-4 py-4 text-center font-semibold text-slate">
                    Ride-hailing apps
                  </th>
                  <th scope="col" className="bg-blue-50/60 px-4 py-4 text-center font-bold text-brand-dark">
                    RideSentinel
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={row.feature} className={cn(i !== COMPARISON.length - 1 && 'border-b border-mist')}>
                    <th scope="row" className="px-5 py-3.5 font-semibold text-ink">
                      {row.feature}
                    </th>
                    <td className="px-4 py-3.5 text-center">
                      <SupportMark value={row.groupChat} />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <SupportMark value={row.rideHailing} />
                    </td>
                    <td className="bg-blue-50/60 px-4 py-3.5 text-center">
                      <SupportMark value={row.rideSentinel} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 max-w-2xl text-[12.5px] leading-relaxed text-slate">
            RideSentinel doesn&apos;t book, match, or track rides on purpose. You still arrange the ride
            yourselves, the same way you do today. See the{' '}
            <a href="#how-it-works" className="font-bold text-brand hover:text-brand-dark">
              scope boundary
            </a>{' '}
            above for what &ldquo;ID-verified&rdquo; does and doesn&apos;t mean.
          </p>
        </div>
      </section>

      {/* Band 2: FAQ */}
      <section id="faq" className="border-b border-mist bg-paper px-5 py-14 text-ink md:px-10 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
          <div>
            <h2 className="font-display text-[28px] font-bold tracking-tight text-ink md:text-[32px]">
              Straight answers before you join.
            </h2>
            <p className="mt-3 text-[14.5px] leading-relaxed text-slate">
              Coverage spans commuters and motorcycle riders around Jaro, La Paz, and Mandurriao in
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

      {/* Closing bar — a verification ticket, perforated stub and all, instead of a generic CTA strip */}
      <section className="border-t border-white/10 bg-ink px-5 py-16 text-white md:px-10 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] md:flex-row">
            {/* Ticket body */}
            <div className="flex-1 px-7 py-8 md:px-9 md:py-10">
              <div className="font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-brand">
                Verification ticket · No. RS&#8209;0001
              </div>
              <h2 className="font-display mt-3 text-[26px] font-bold tracking-tight md:text-[32px]">
                Takes a day to verify. Takes a minute at pickup.
              </h2>
              <p className="mt-2 max-w-sm text-[14.5px] leading-relaxed text-slate-300">
                Create your account now or sign in to view your verification status.
              </p>

              {/* Flow — a real stepper (icon nodes threaded on one line), not just stated prose */}
              <div className="relative mt-10 max-w-md">
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 top-5 h-px bg-gradient-to-r from-brand via-verified to-pending opacity-50"
                />
                <div className="relative grid grid-cols-3 gap-2 text-center">
                  <div className="flex flex-col items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-brand bg-ink text-brand">
                      <IdCard size={18} strokeWidth={2.2} />
                    </div>
                    <div>
                      <div className="text-[12.5px] font-bold text-white">ID review</div>
                      <div className="font-mono text-[10px] text-slate-400">~24 hours</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-verified bg-ink text-verified">
                      <ScanFace size={18} strokeWidth={2.2} />
                    </div>
                    <div>
                      <div className="text-[12.5px] font-bold text-white">Face confirmed</div>
                      <div className="font-mono text-[10px] text-slate-400">60s handshake</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-pending bg-ink text-pending">
                      <Handshake size={18} strokeWidth={2.2} />
                    </div>
                    <div>
                      <div className="text-[12.5px] font-bold text-white">At pickup</div>
                      <div className="font-mono text-[10px] text-slate-400">ride confirmed</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Perforation — punched notches top and bottom, like a torn ticket stub */}
            <div className="relative hidden border-l border-dashed border-white/15 md:block" aria-hidden="true">
              <span className="absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full bg-ink" />
              <span className="absolute -bottom-2.5 -left-2.5 h-5 w-5 rounded-full bg-ink" />
            </div>
            <div className="border-t border-dashed border-white/15 md:hidden" aria-hidden="true" />

            {/* Ticket stub — the actual action */}
            <div className="flex flex-col justify-center gap-3 px-7 py-8 md:w-[220px] md:px-8 md:py-10">
              <svg
                viewBox="0 0 120 28"
                className="h-6 w-full text-white/25"
                aria-hidden="true"
                preserveAspectRatio="none"
              >
                {[2, 6, 9, 13, 15, 19, 23, 27, 31, 36, 39, 43, 48, 52, 55, 60, 64, 68, 73, 77, 81, 86, 90, 95, 99, 104, 108, 113, 117].map(
                  (x, i) => (
                    <rect key={x} x={x} y="0" width={i % 3 === 0 ? 2 : 1} height="28" fill="currentColor" />
                  ),
                )}
              </svg>
              <Link
                to="/register"
                className={cn(buttonVariants({ variant: 'primary', size: 'lg' }), 'w-full rounded-xl')}
              >
                Register
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/login"
                className="inline-flex h-[52px] w-full items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-6 text-[14.5px] font-bold text-white transition-colors hover:border-white/25 hover:bg-white/[0.08]"
              >
                Log in
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative overflow-hidden border-t border-white/10 bg-[#0B1120] px-5 pb-8 pt-14 text-slate-300 md:px-10 md:pb-10 md:pt-20">
        {/* Real Iloilo City basemap (mapcn/MapLibre), static and non-interactive, faded behind the footer content */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-30 grayscale">
          <Suspense fallback={null}>
            <Map
              className="h-full w-full"
              theme="dark"
              interactive={false}
              attributionControl={false}
              viewport={{ center: [122.549, 10.705], zoom: 12.4, bearing: 0, pitch: 0 }}
            />
          </Suspense>
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B1120] via-[#0B1120]/85 to-[#0B1120]/55"
        />

        <div className="relative mx-auto max-w-6xl">
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4">
            <div className="col-span-2 sm:col-span-1">
              <BrandMark />
              <p className="mt-4 max-w-[26ch] text-[13.5px] leading-relaxed text-slate-400">
                ID-verified pickup confirmation for informal motorcycle rides.
              </p>
            </div>

            <div>
              <div className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">Product</div>
              <ul className="mt-3.5 space-y-2.5 text-[13.5px] font-semibold">
                <li>
                  <a href="#how-it-works" className="transition-colors hover:text-white">
                    How it works
                  </a>
                </li>
                <li>
                  <a href="#faq" className="transition-colors hover:text-white">
                    FAQ
                  </a>
                </li>
                <li>
                  <a
                    href="/ridesentinel.apk"
                    download
                    className="inline-flex items-center gap-1.5 transition-colors hover:text-white"
                  >
                    <Download size={13} strokeWidth={2.2} />
                    Download Android app
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <div className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">Account</div>
              <ul className="mt-3.5 space-y-2.5 text-[13.5px] font-semibold">
                <li>
                  <Link to="/register" className="transition-colors hover:text-white">
                    Register
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="transition-colors hover:text-white">
                    Log in
                  </Link>
                </li>
                <li>
                  <Link to="/report" className="transition-colors hover:text-white">
                    Report something
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <div className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">Legal</div>
              <ul className="mt-3.5 space-y-2.5 text-[13.5px] font-semibold">
                <li>
                  <Link to="/consent" className="transition-colors hover:text-white">
                    Privacy &amp; Terms
                  </Link>
                </li>
                <li>
                  <Link to="/admin" className="transition-colors hover:text-white">
                    Admin
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="font-mono text-xs text-slate-500">
              RideSentinel · Jaro / La Paz / Mandurriao, Iloilo City
            </div>
            <div className="font-mono text-xs text-slate-500">&copy; {new Date().getFullYear()} RideSentinel</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
