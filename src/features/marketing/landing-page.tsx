import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  ArrowRight,
  Bike,
  Bookmark,
  Check,
  Download,
  Flag,
  Handshake,
  IdCard,
  Minus,
  MessageCircle,
  Moon,
  Navigation2,
  Plus,
  Radar,
  ScanFace,
  Search,
  Share2,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  UserRound,
  X,
} from 'lucide-react'
import { BrandMark } from '@/components/brand-mark'
import { AndroidGlyph, AppleGlyph } from '@/components/platform-icons'
import { buttonVariants } from '@/components/ui/button-variants'
import { cn } from '@/lib/utils'
import { useScrollReveal } from '@/hooks/use-scroll-reveal'
import { MapRoute, RouteProgress, RouteMarker, MarkerContent } from '@/components/ui/map'
import { ILOILO_DEMO_ROUTE } from '../../../convex/lib/iloiloRoute'


gsap.registerPlugin(ScrollTrigger)

// maplibre-gl is >1MB — only the footer needs it, so it must not block the
// landing page's initial bundle. Lazy-load it and let the footer's own
// gradient/background color stand in until it's ready.
const Map = lazy(() => import('@/components/ui/map').then((m) => ({ default: m.Map })))

const HEADLINE_LINES = ['Your ride, verified', 'end to end.']

const ROLE_FLOWS = [
  {
    role: 'Driver',
    icon: Bike,
    steps: [
      {
        moment: 'Before pickup',
        title: 'Get ID-verified',
        body: 'Upload a government or school ID and a selfie. An admin reviews it manually, usually within 24 hours.',
      },
      {
        moment: 'At the curb',
        title: 'Show your 60s QR',
        body: 'Display your rotating single-use code for the passenger to scan with their camera.',
      },
      {
        moment: 'Face-to-face',
        title: 'Confirm the passenger',
        body: 'Check their verified photo against the person you’re about to pick up.',
      },
      {
        moment: 'Within 48 hours',
        title: 'Rate the passenger',
        body: 'Your rating stays locked until they rate you too, or the 48-hour window closes.',
      },
    ],
  },
  {
    role: 'Passenger',
    icon: UserRound,
    steps: [
      {
        moment: 'Before pickup',
        title: 'Get ID-verified',
        body: 'Upload a government or school ID and a selfie. An admin reviews it manually, usually within 24 hours.',
      },
      {
        moment: 'At the curb',
        title: 'Scan the driver’s QR',
        body: 'Scan their rotating single-use code with your camera the moment you meet.',
      },
      {
        moment: 'Face-to-face',
        title: 'Confirm the driver',
        body: 'Check their verified photo against the person on the bike in front of you.',
      },
      {
        moment: 'Within 48 hours',
        title: 'Rate the driver',
        body: 'Your rating stays locked until they rate you too, or the 48-hour window closes.',
      },
    ],
  },
] as const

type Support = 'yes' | 'no' | 'partial' | 'soon'

const COMPARISON: { feature: string; groupChat: Support; rideHailing: Support; rideSentinel: Support }[] = [
  { feature: 'ID verified before you meet', groupChat: 'no', rideHailing: 'partial', rideSentinel: 'yes' },
  { feature: 'Face-to-face pickup confirmation', groupChat: 'no', rideHailing: 'no', rideSentinel: 'yes' },
  { feature: 'Mutual blind rating', groupChat: 'no', rideHailing: 'partial', rideSentinel: 'yes' },
  { feature: 'Works with rides you already arranged', groupChat: 'yes', rideHailing: 'no', rideSentinel: 'yes' },
  { feature: 'Booking, matching & in-app payment', groupChat: 'no', rideHailing: 'yes', rideSentinel: 'soon' },
  { feature: 'GPS ride tracking', groupChat: 'no', rideHailing: 'yes', rideSentinel: 'soon' },
  { feature: 'Save trusted, verified riders', groupChat: 'no', rideHailing: 'partial', rideSentinel: 'yes' },
  { feature: 'Safety check-in with an emergency contact', groupChat: 'no', rideHailing: 'partial', rideSentinel: 'yes' },
  { feature: 'Trust record that grows with ride history', groupChat: 'no', rideHailing: 'partial', rideSentinel: 'yes' },
  { feature: 'Admin-reviewed incident reports', groupChat: 'no', rideHailing: 'yes', rideSentinel: 'yes' },
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
  if (value === 'soon') {
    return (
      <span className="inline-flex items-center rounded-full bg-pending/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-pending">
        Soon
      </span>
    )
  }
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-mist text-slate-400">
      <X size={14} strokeWidth={3} />
    </span>
  )
}

const TRUST_FEATURES = [
  {
    icon: Bookmark,
    title: 'Trusted riders',
    body: 'Save the verified drivers you already ride with regularly. Skip re-verifying someone you already trust.',
  },
  {
    icon: Share2,
    title: 'Ride safety check-in',
    body: 'Share a confirmed pickup, who, when, and their verified photo, with an emergency contact in one tap.',
  },
  {
    icon: TrendingUp,
    title: 'A trust record that grows',
    body: 'Verified status isn’t a one-time badge. Ride history and consistency build a profile over time.',
  },
  {
    icon: Flag,
    title: 'Reports an admin reviews',
    body: 'Flag a bad interaction and an admin looks into it, not a bot that auto-closes the ticket.',
  },
] as const

// Pilot feature set (2026-11-25) — everything added on top of the core
// ID-verification/handshake loop above. Labeled "pilot/demo" throughout
// the app itself (see docs/DECISIONS.md): ride matching, fare/ETA, and
// GPS tracking here are simulated for the pilot, not a real dispatch or
// payment system.
const APP_FEATURES = [
  {
    icon: Search,
    title: 'Request a ride',
    body: 'Get matched with an already-verified driver online nearby in Iloilo City, with a ballpark fare and ETA before you commit.',
  },
  {
    icon: Navigation2,
    title: 'Turn-by-turn tracking',
    body: 'Follow the trip on a live map with simulated GPS, step-by-step directions, and an arrival estimate — the same view your driver sees.',
  },
  {
    icon: Share2,
    title: 'Live trip sharing',
    body: 'Send a trusted contact a link that shows your ride status in real time. No login required on their end, no phone number shown.',
  },
  {
    icon: ShieldAlert,
    title: 'One-tap SOS',
    body: "Flag a problem mid-ride and it's logged for an admin to review immediately — not a silent toast that goes nowhere.",
  },
  {
    icon: Moon,
    title: 'Night ride mode',
    body: 'Rides between 10pm and 5am automatically share your live status and keep SOS one tap away, no extra steps.',
  },
  {
    icon: ShieldCheck,
    title: 'Verified badge at match time',
    body: "See your driver's ID-verified badge the moment you're matched, not buried three taps into a profile.",
  },
  {
    icon: MessageCircle,
    title: 'In-app messages',
    body: 'Message your driver or passenger directly, and see app updates and announcements, all in one inbox.',
  },
  {
    icon: Radar,
    title: 'Admin live ops',
    body: 'Admins can watch every active ride on a map and respond to SOS incidents from a dedicated, time-sensitive queue.',
  },
] as const

const FAQ = [
  [
    'Is this a ride-hailing app?',
    "Not a real one. The pilot includes a ride-matching flow with a simulated fare estimate and GPS tracking so you can try the full experience, but there's no live routing, real dispatch, or payment behind it. The part that's real is the ID-verification and pickup handshake.",
  ],
  [
    'What happens to my ID photo?',
    'A human administrator reviews it to verify your account, and the image is deleted 30 days after that decision either way. No ID number is ever read or stored.',
  ],
  [
    'Who sees my rating?',
    "Nobody, until you both rate each other or 48 hours pass, whichever comes first. You can't see theirs by submitting yours early.",
  ],
  [
    'What if my ID gets rejected?',
    "You'll see the reason on your status page, and you can fix the issue and resubmit. Verification isn't a one-time pass or fail.",
  ],
  [
    'Do I have to pay to use RideSentinel?',
    "No. Verification, the QR handshake, and ratings are all free. RideSentinel doesn't charge fares or take a cut, because it doesn't arrange the ride.",
  ],
] as const

export function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const reduceMotion = useReducedMotion()
  const stepsRef = useScrollReveal<HTMLDivElement>()
  const faqRef = useScrollReveal<HTMLDivElement>()
  const headlineRef = useRef<HTMLHeadingElement>(null)

  // Hero motorcycle animation: cruises the fixed demo route in a loop,
  // eased (slow pull away from a stop, slow roll into the next one) rather
  // than a flat linear crawl, which read as mechanical/unrealistic. Frozen
  // mid-route under prefers-reduced-motion — it's decorative, not
  // information, so it's fine to just stop moving rather than try to
  // respect reduced motion with a slower/no-op version of the same loop.
  const [heroRouteT, setHeroRouteT] = useState(0)
  useEffect(() => {
    if (reduceMotion) {
      setHeroRouteT(0.4)
      return
    }
    const ONE_WAY_MS = 11000
    const PAUSE_MS = 1100
    const easeInOutSine = (x: number) => -(Math.cos(Math.PI * x) - 1) / 2
    let raf: number
    let start: number | null = null
    let phase: 'forward' | 'pausing' = 'forward'
    let pauseStart = 0

    function tick(now: number) {
      if (start === null) start = now
      if (phase === 'forward') {
        const linear = Math.min(1, (now - start) / ONE_WAY_MS)
        setHeroRouteT(easeInOutSine(linear))
        if (linear >= 1) {
          phase = 'pausing'
          pauseStart = now
        }
      } else if (now - pauseStart >= PAUSE_MS) {
        start = now
        phase = 'forward'
        setHeroRouteT(0)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reduceMotion])

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

          <nav className="hidden items-center gap-8 text-[13.5px] font-semibold text-slate-300 md:flex">
            <a href="#how-it-works" className="group relative py-1 transition-colors hover:text-white">
              How it works
              <span className="absolute inset-x-0 -bottom-[1px] h-px origin-left scale-x-0 bg-brand transition-transform duration-200 group-hover:scale-x-100" />
            </a>
            <a href="#faq" className="group relative py-1 transition-colors hover:text-white">
              FAQ
              <span className="absolute inset-x-0 -bottom-[1px] h-px origin-left scale-x-0 bg-brand transition-transform duration-200 group-hover:scale-x-100" />
            </a>
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="tap-feedback whitespace-nowrap px-2 py-1.5 text-[13.5px] font-semibold text-slate-200 transition-colors hover:text-white sm:px-3"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-brand px-3.5 text-[13.5px] font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-md active:translate-y-0 active:scale-[0.97] sm:px-4"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* First viewport — asymmetric hero, phone bleeds past the content edge */}
      <section className="relative overflow-hidden bg-white px-5 pb-20 pt-14 text-ink md:px-10 md:pb-28 md:pt-20">
        {/* Real Iloilo City basemap, faded behind the content — not a blurred blob or stock decoration.
            No negative z-index on this wrapper: that alone (independent of opacity/filter/mask)
            breaks the WebGL canvas's compositing in this browser and renders it fully blank.
            Stacking below the content is done with DOM order + the content wrapper's z-10 instead. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
          <Suspense fallback={null}>
            <Map
              className="h-full w-full"
              theme="light"
              interactive={false}
              attributionControl={false}
              viewport={{ center: [122.555, 10.712], zoom: 14.6, bearing: 0, pitch: 0 }}
            >
              <MapRoute coordinates={ILOILO_DEMO_ROUTE} color="#cbd5e1" width={3}>
                <RouteProgress color="#1e3a8a" width={3} />
                <RouteMarker at={heroRouteT}>
                  <MarkerContent>
                    <div className="relative flex h-8 w-8 items-center justify-center">
                      <span className="absolute h-8 w-8 animate-ping rounded-full bg-brand opacity-30" />
                      <span className="relative flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-brand text-white shadow-lg">
                        <Bike size={13} strokeWidth={2.4} />
                      </span>
                    </div>
                  </MarkerContent>
                </RouteMarker>
              </MapRoute>
            </Map>
          </Suspense>
        </div>
        {/* The text column is left-aligned, not centered, so the wash has to be
            strongest there and fade out to the right — a centered radial left
            city labels cutting straight through the headline/paragraph. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              'linear-gradient(100deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.96) 38%, rgba(255,255,255,0.75) 58%, rgba(255,255,255,0.3) 78%, rgba(255,255,255,0.05) 100%), linear-gradient(to top, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 30%)',
          }}
        />
        {/* Dot-grid texture over the map, keeps the signal-grid motif without competing with it */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            backgroundImage: 'radial-gradient(circle, #CBD5E1 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            maskImage: 'radial-gradient(70% 60% at 78% 10%, black 0%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(70% 60% at 78% 10%, black 0%, transparent 75%)',
          }}
        />

        <div className="relative z-10 mx-auto grid max-w-6xl items-start">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="lg:pt-6"
          >
            <div className="border-l-2 border-brand pl-3 font-mono text-xs font-semibold uppercase tracking-wider text-slate">
              Built for Iloilo City
            </div>

            <h1
              ref={headlineRef}
              className="font-display mt-5 overflow-hidden text-[32px] font-extrabold leading-[1.1] tracking-[-0.03em] text-ink sm:text-[52px] lg:text-[58px] lg:leading-[1.03]"
            >
              {/* Each line can wrap at narrow widths (long line + large type doesn't
                  always fit in one row) — overflow-hidden lives on the h1 itself so a
                  wrapped sub-line still shows, instead of clipping it like the old
                  per-span overflow-hidden did. */}
              {HEADLINE_LINES.map((line) => (
                <span key={line} data-line className="block">
                  {line}
                </span>
              ))}
            </h1>

            <p className="mt-5 max-w-md text-[15.5px] leading-relaxed text-slate">
              Request a ride, watch it approach on a live map, and know it&apos;s really them before you
              get on — an ID-verified driver, a 60-second QR handshake, and a trip you can share with
              someone who cares where you are. Built for Iloilo City, not adapted from somewhere else.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                to="/register"
                className={cn(buttonVariants({ variant: 'primary', size: 'lg' }), 'rounded-xl px-6 shadow-sm')}
              >
                Register
                <ArrowRight size={16} strokeWidth={2.2} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/login"
                className="inline-flex h-[52px] items-center justify-center gap-1.5 rounded-xl border border-ink/15 bg-white px-5 text-[14.5px] font-bold text-ink transition-all duration-200 hover:-translate-y-0.5 hover:border-ink/25 hover:bg-mist hover:shadow-sm active:translate-y-0 active:scale-[0.97]"
              >
                Log in
              </Link>
            </div>

            <div className="mt-4 flex items-center gap-2.5 text-[12.5px] font-semibold leading-none text-slate">
              <a
                href="/ridesentinel.apk"
                download
                className="inline-flex items-center gap-1.5 leading-none text-ink transition-colors hover:text-brand"
              >
                <AndroidGlyph className="h-3.5 w-3.5 flex-shrink-0 self-center" />
                <span className="leading-none">Download for Android</span>
              </a>
              <span className="leading-none text-ink/20">·</span>
              <span className="inline-flex items-center gap-1.5 leading-none text-slate-400">
                <AppleGlyph className="h-3.5 w-3.5 flex-shrink-0 self-center" />
                <span className="leading-none">iOS</span>
                <span className="inline-flex items-center rounded-full bg-mist px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase leading-none tracking-wider text-slate">
                  Soon
                </span>
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Band 0.5: What RideSentinel actually is, before the step-by-step */}
      <section className="bg-paper px-5 py-14 text-ink md:px-10 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="font-mono text-xs font-bold uppercase tracking-wider text-brand">
            What RideSentinel is
          </div>
          <h2 className="font-display mt-2 max-w-2xl text-[26px] font-bold leading-[1.2] tracking-tight text-ink md:text-[32px]">
            A trust layer for rides you already arrange yourself.
          </h2>
          <p className="mt-4 max-w-2xl text-[14.5px] leading-relaxed text-slate">
            RideSentinel isn&apos;t a real dispatch or payment platform. The pilot does include a
            ride-matching flow with simulated GPS tracking, so you can see it end to end, but the fare
            shown is a ballpark estimate, not a quote, and the route is a demo, not live routing.
            Underneath all of that sits the verification layer that answers the one question group
            chats and word of mouth can&apos;t: is this actually the person you&apos;re supposed to be
            meeting?
          </p>

          <div className="mt-8 grid grid-cols-1 gap-6 border-t border-mist pt-7 sm:grid-cols-3">
            <div className="group flex items-start gap-3 rounded-lg p-2 -m-2 transition-colors duration-200 hover:bg-page">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-brand transition-transform duration-200 group-hover:scale-110">
                <IdCard size={18} strokeWidth={2.2} />
              </div>
              <div>
                <div className="text-[14px] font-bold text-ink">ID-verified</div>
                <p className="mt-0.5 text-[13px] leading-snug text-slate">
                  An admin checks a government or school ID before you ever meet.
                </p>
              </div>
            </div>
            <div className="group flex items-start gap-3 rounded-lg p-2 -m-2 transition-colors duration-200 hover:bg-page">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-brand transition-transform duration-200 group-hover:scale-110">
                <ScanFace size={18} strokeWidth={2.2} />
              </div>
              <div>
                <div className="text-[14px] font-bold text-ink">Confirmed at pickup</div>
                <p className="mt-0.5 text-[13px] leading-snug text-slate">
                  A 60-second QR handshake confirms you&apos;re both who you say you are.
                </p>
              </div>
            </div>
            <div className="group flex items-start gap-3 rounded-lg p-2 -m-2 transition-colors duration-200 hover:bg-page">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-brand transition-transform duration-200 group-hover:scale-110">
                <Handshake size={18} strokeWidth={2.2} />
              </div>
              <div>
                <div className="text-[14px] font-bold text-ink">Rated honestly</div>
                <p className="mt-0.5 text-[13px] leading-snug text-slate">
                  Blind mutual ratings stay locked until both sides submit.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Band 1: Driver vs. passenger flow, with the quick facts folded in */}
      <section id="how-it-works" className="border-b border-mist bg-paper px-5 py-14 text-ink md:px-10 md:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-[28px] font-bold tracking-tight text-ink md:text-[34px]">
            Whichever side of the pickup you&apos;re on.
          </h2>
          <p className="mt-3 max-w-sm text-[14px] leading-snug text-slate">
            Same core flow, different seat. Both sides verify, confirm, and rate, just in a slightly
            different order.
          </p>

          <div ref={stepsRef} className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {ROLE_FLOWS.map(({ role, icon: RoleIcon, steps }) => (
              <div key={role} className="rounded-2xl border border-mist bg-page p-6">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-brand">
                    <RoleIcon size={18} strokeWidth={2.2} />
                  </div>
                  <h3 className="font-display text-[17px] font-bold tracking-tight text-ink">
                    If you&apos;re a {role.toLowerCase()}
                  </h3>
                </div>

                <ol className="mt-5 space-y-4 border-t border-mist pt-5">
                  {steps.map((step) => (
                    <li key={step.title}>
                      <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-brand">
                        {step.moment}
                      </div>
                      <div className="mt-1 text-[14.5px] font-bold text-ink">{step.title}</div>
                      <p className="mt-0.5 text-[13px] leading-relaxed text-slate">{step.body}</p>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>

          {/* Quick facts, folded in from the old standalone stat band */}
          <dl className="mt-8 grid grid-cols-1 gap-6 rounded-xl border border-mist bg-ink px-5 py-5 sm:grid-cols-3 sm:divide-x sm:divide-white/15 tabular-nums">
            <div className="sm:pr-5">
              <dt className="font-mono text-[22px] font-bold leading-none text-white">60s</dt>
              <dd className="mt-1.5 text-xs leading-snug text-slate-300">Single-use QR expiry</dd>
            </div>
            <div className="sm:px-5">
              <dt className="font-mono text-[22px] font-bold leading-none text-white">2/2</dt>
              <dd className="mt-1.5 text-xs leading-snug text-slate-300">Mutual face confirm</dd>
            </div>
            <div className="sm:pl-5">
              <dt className="font-mono text-[22px] font-bold leading-none text-white">48h</dt>
              <dd className="mt-1.5 text-xs leading-snug text-slate-300">Blind rating lock</dd>
            </div>
          </dl>

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
              className="group inline-flex flex-shrink-0 items-center gap-1 text-[13.5px] font-bold text-brand transition-colors hover:text-brand-dark"
            >
              Privacy &amp; Terms{' '}
              <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Band 1.2: Beyond the one-time check — trust that compounds with use */}
      <section className="border-b border-mist bg-paper px-5 py-14 text-ink md:px-10 md:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-[28px] font-bold tracking-tight text-ink md:text-[34px]">
            Verification isn&apos;t a one-time checkbox.
          </h2>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-slate">
            The ID check and pickup handshake are the core. What you get after the first ride is what
            keeps it useful.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST_FEATURES.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="group rounded-xl border border-mist bg-page p-5 transition-all duration-200 hover:-translate-y-1 hover:border-brand/30 hover:bg-paper hover:shadow-lg"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-brand transition-transform duration-200 group-hover:scale-110">
                  <Icon size={18} strokeWidth={2.2} />
                </div>
                <h3 className="font-display mt-3.5 text-[15.5px] font-bold tracking-tight text-ink">
                  {title}
                </h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Band 1.4: Pilot feature set — everything added on top of the core
          verification/handshake loop. All demo/simulated for the pilot;
          see the honest-comparison band right after this one for what
          that does and doesn't mean. */}
      <section id="features" className="border-b border-mist bg-page px-5 py-14 text-ink md:px-10 md:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-[28px] font-bold tracking-tight text-ink md:text-[34px]">
            What&apos;s in the app
          </h2>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-slate">
            Built around the pilot: finding a ride, knowing where it is, and staying safe along the way.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {APP_FEATURES.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="group rounded-xl border border-mist bg-paper p-5 transition-all duration-200 hover:-translate-y-1 hover:border-brand/30 hover:shadow-lg"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-brand transition-transform duration-200 group-hover:scale-110">
                  <Icon size={18} strokeWidth={2.2} />
                </div>
                <h3 className="font-display mt-3.5 text-[15.5px] font-bold tracking-tight text-ink">
                  {title}
                </h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate">{body}</p>
              </div>
            ))}
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
                  <tr
                    key={row.feature}
                    className={cn(
                      'transition-colors duration-150 hover:bg-page',
                      i !== COMPARISON.length - 1 && 'border-b border-mist',
                    )}
                  >
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
            The pilot&apos;s ride-matching and GPS tracking are simulated on purpose — there&apos;s no real
            dispatch engine, live routing, or payment processing behind them. See the{' '}
            <a href="#how-it-works" className="font-bold text-brand hover:text-brand-dark">
              scope boundary
            </a>{' '}
            above for what &ldquo;ID-verified&rdquo; does and doesn&apos;t mean, and the{' '}
            <a href="#features" className="font-bold text-brand hover:text-brand-dark">
              feature list
            </a>{' '}
            above that for everything in the pilot.
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
              Coverage spans commuters and motorcycle riders across Iloilo City.
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
                    className="group flex w-full items-center justify-between gap-4 text-left"
                    aria-expanded={open}
                  >
                    <span className="text-[15.5px] font-bold text-ink transition-colors group-hover:text-brand md:text-[16.5px]">
                      {q}
                    </span>
                    <Plus
                      size={18}
                      className={cn(
                        'flex-shrink-0 text-slate transition-transform duration-200 group-hover:text-brand',
                        open && 'rotate-45 text-ink group-hover:text-ink',
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
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/login"
                className="inline-flex h-[52px] w-full items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-6 text-[14.5px] font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.08] active:translate-y-0 active:scale-[0.97]"
              >
                Log in
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative overflow-hidden border-t border-white/10 bg-[#0B1120] px-5 pb-8 pt-14 text-slate-300 md:px-10 md:pb-10 md:pt-20">
        {/* Real Iloilo City basemap (mapcn/MapLibre). No CSS opacity/filter here — both break the
            WebGL canvas's compositing and render it blank; the gradient overlay below does the
            fading instead, without ever touching the canvas. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <Suspense fallback={null}>
            <Map
              className="h-full w-full"
              theme="dark"
              interactive={false}
              attributionControl={false}
              viewport={{ center: [122.555, 10.712], zoom: 14.4, bearing: 0, pitch: 0 }}
            />
          </Suspense>
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B1120] via-[#0B1120]/92 to-[#0B1120]/75"
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
              RideSentinel · Iloilo City
            </div>
            <div className="font-mono text-xs text-slate-500">&copy; {new Date().getFullYear()} RideSentinel</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
