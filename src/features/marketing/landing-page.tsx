import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, QrCode, UserCheck, Star, Plus, ArrowRight } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button-variants'
import { cn } from '@/lib/utils'
import { useReveal } from '@/hooks/use-reveal'

const RULES = [
  {
    stat: '60s',
    title: 'QR codes expire',
    body: 'Every code is one-time and dies in a minute. A screenshot is useless.',
  },
  {
    stat: '2/2',
    title: 'Ratings need a confirmed meeting',
    body: 'Both people have to confirm, in person, before either can rate the other.',
  },
  {
    stat: '0',
    title: 'The server decides what’s true',
    body: 'Tier, verification, and ratings are never decided by your phone — client input is zero.',
  },
]

const STEPS = [
  ['01', 'Get ID-verified', 'Submit an ID photo and a selfie. An admin reviews it — usually within a day.'],
  ['02', 'Show or scan a QR', 'At pickup, one of you shows a rotating code, the other scans it.'],
  ['03', 'Both confirm', 'You each see the other’s photo and tap “this is the person.”'],
  ['04', 'Rate within 48h', 'Ratings stay hidden until you both rate, or the window closes.'],
] as const

const FEATURE_ROWS = [
  {
    tag: 'Verify',
    title: 'A code that expires before it can be screenshotted',
    body: 'Every QR is single-use and dies in 60 seconds. There is nothing to forward, save, or reuse — only a live code the server just issued.',
    mock: 'qr' as const,
  },
  {
    tag: 'Confirm',
    title: 'See a photo before you get on the bike',
    body: 'Scanning pulls up the other rider’s verified photo, name, and rating. You both tap confirm, in person, before anything counts.',
    mock: 'confirm' as const,
  },
  {
    tag: 'Rate',
    title: 'Ratings that can’t be gamed by whoever rates first',
    body: 'Scores stay hidden until both of you rate each other, or 48 hours pass. No reason to rush, no reason to retaliate.',
    mock: 'rate' as const,
  },
]

function PhoneMock({ kind }: { kind: 'qr' | 'confirm' | 'rate' }) {
  return (
    <div className="relative">
      {/* Ambient brand-tinted glow grounding the device */}
      <div
        className="pointer-events-none absolute inset-x-6 bottom-0 h-16 rounded-full opacity-50 blur-2xl"
        style={{ background: 'radial-gradient(closest-side, #2563EB, transparent)' }}
        aria-hidden="true"
      />
      {/* Metallic frame — iPhone 17 Pro Max proportions: 440×956pt logical
          display (6.9"), scaled down to 196×426px keeping the exact ratio */}
      <div
        className="relative h-[426px] w-[196px] rounded-[46px] p-[3px] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)]"
        style={{ background: 'linear-gradient(155deg, #3a3f4b 0%, #121419 45%, #050608 100%)' }}
      >
        {/* Side buttons */}
        <div className="absolute -left-[2px] top-24 h-7 w-[3px] rounded-l-full bg-[#2a2d34]" />
        <div className="absolute -left-[2px] top-36 h-12 w-[3px] rounded-l-full bg-[#2a2d34]" />
        <div className="absolute -right-[2px] top-32 h-16 w-[3px] rounded-r-full bg-[#2a2d34]" />

        <div className="h-full w-full overflow-hidden rounded-[43px] bg-ink">
          {/* Status bar */}
          <div className="relative flex items-center justify-between px-5 pt-3 text-[10px] font-semibold text-white/90">
            <span>9:41</span>
            <div className="absolute left-1/2 top-[7px] h-[20px] w-[70px] -translate-x-1/2 rounded-full bg-black" />
            <div className="flex items-center gap-1">
              <div className="flex gap-[1.5px]">
                {[3, 5, 7, 9].map((h) => (
                  <span key={h} className="w-[2.5px] rounded-sm bg-white/90" style={{ height: h }} />
                ))}
              </div>
            </div>
          </div>

          <div className="flex h-[calc(100%-32px)] flex-col items-center justify-center gap-2.5 bg-page px-4">
            {kind === 'qr' && (
              <>
                <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-ink shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
                  <QrCode size={46} strokeWidth={1.5} className="text-white" />
                </div>
                <div className="rounded-full bg-paper px-2.5 py-1 text-[9px] font-bold text-slate shadow-[0_1px_3px_rgba(15,23,42,0.12)]">
                  Refreshes in 42s
                </div>
              </>
            )}
            {kind === 'confirm' && (
              <>
                <div className="h-16 w-16 rounded-full bg-mist shadow-[0_2px_8px_rgba(15,23,42,0.1)]" />
                <div className="text-[11px] font-bold text-ink">Marco D.</div>
                <div className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[9px] font-bold text-verified">
                  <UserCheck size={10} strokeWidth={2.2} />
                  ID-verified
                </div>
                <div className="mt-1 w-full rounded-xl bg-brand py-2 text-center text-[9px] font-bold text-white shadow-[0_4px_12px_rgba(37,99,235,0.4)]">
                  This is the person
                </div>
              </>
            )}
            {kind === 'rate' && (
              <>
                <div className="text-[10.5px] font-bold text-ink">How was the ride?</div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} className="text-pending" fill={i < 4 ? '#D97706' : 'none'} />
                  ))}
                </div>
                <div className="mt-1 w-full rounded-xl bg-paper py-2 text-center text-[9px] text-slate shadow-[0_1px_3px_rgba(15,23,42,0.12)]">
                  Hidden until you both rate
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const MANIFESTO = [
  "Arranging a ride over a group chat means showing up to meet someone you've never actually seen.",
  "A verified name and a photo you can check against the person in front of you fixes that. Not a background check — just confirmation that who shows up is who said they would.",
  'We built RideSentinel so a community can vouch for itself, one confirmed meeting at a time.',
]

const FAQ = [
  [
    'Is this a ride-hailing app?',
    "No. There's no matching, booking, pricing, or payment. You still arrange the ride yourselves — this just confirms who you're meeting.",
  ],
  [
    'What happens to my ID photo?',
    "Nothing is read from it automatically — a human administrator reviews it. It's deleted 30 days after that review either way.",
  ],
  [
    "What if the person doesn't match their photo?",
    'Cancel on the spot and report it. No meeting gets counted, and the report goes straight to an administrator.',
  ],
  [
    'Who sees my rating?',
    "Nobody, until you both rate each other or 48 hours pass — whichever comes first. You can't see theirs just by rating fast.",
  ],
  [
    'Can I delete my account?',
    'Yes, anytime, from your profile. Past ratings stay as anonymous numbers so they don’t get deleted, so other people’s scores stay accurate.',
  ],
] as const

function Reveal({
  as: Tag = 'div',
  delay,
  className,
  children,
}: {
  as?: 'div' | 'p'
  delay?: number
  className?: string
  children: React.ReactNode
}) {
  const { ref, motionProps } = useReveal({ delay })
  const MotionTag = Tag === 'p' ? motion.p : motion.div
  return (
    <MotionTag ref={ref as never} className={className} {...motionProps}>
      {children}
    </MotionTag>
  )
}

export function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <div className="min-h-dvh bg-ink text-white">
      {/* Nav — sticky, layered depth instead of a flat line */}
      <nav className="sticky top-0 z-20 border-b border-white/[0.08] bg-ink/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-10">
          <div className="flex items-center gap-2.5">
            <div className="neu-brand flex h-8 w-8 items-center justify-center rounded-xl">
              <Shield size={16} strokeWidth={2.2} className="text-white" fill="#FFFFFF" />
            </div>
            <span className="text-[14.5px] font-extrabold tracking-tight">RideSentinel</span>
          </div>
          <div className="hidden items-center gap-8 text-[13px] font-semibold text-slate-300 md:flex">
            <a href="#how-it-works" className="transition-colors hover:text-white">
              How it works
            </a>
            <a href="#faq" className="transition-colors hover:text-white">
              FAQ
            </a>
          </div>
          <div className="flex items-center gap-5">
            <Link
              to="/login"
              className="hidden text-[13px] font-semibold text-white transition-colors hover:text-slate-300 md:block"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className={cn(
                buttonVariants({ variant: 'heroPrimary', size: 'pill' }),
                'shadow-[0_4px_16px_rgba(37,99,235,0.35)] transition-transform hover:scale-[1.03]',
              )}
            >
              Register
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero — asymmetric two-column, no decoration */}
      <div className="px-5 py-14 md:px-10 md:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-[1.1fr_0.9fr] md:gap-16">
          <Reveal>
            <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-pending">
              Pilot · Iloilo City
            </div>
            <h1 className="mt-4 text-[42px] font-extrabold leading-[1.05] tracking-tight text-white md:text-[56px]">
              Know who you&apos;re meeting
              <br />
              before you ride.
            </h1>
            <p className="mt-5 max-w-[420px] text-[15px] leading-snug text-slate-400 md:text-[17px]">
              A motorcycle ride is arranged in a chat. RideSentinel confirms, with a verified photo and a
              live QR handshake, that the person who shows up is actually them.
            </p>

            <Link
              to="/register"
              className={cn(
                buttonVariants({ variant: 'heroPrimary', size: 'lg' }),
                'group mt-8 w-fit justify-between gap-6 pl-7 pr-2',
              )}
            >
              Register
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 transition-transform group-hover:translate-x-0.5">
                <ArrowRight size={16} strokeWidth={2.2} />
              </span>
            </Link>

            <div className="mt-10 flex items-center gap-3">
              <div className="flex -space-x-2.5">
                {['J', 'L', 'M'].map((letter) => (
                  <div
                    key={letter}
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink bg-white/10 text-[11px] font-bold text-white"
                  >
                    {letter}
                  </div>
                ))}
              </div>
              <div className="text-[13px] leading-snug text-slate-400">
                <span className="font-extrabold text-white">3 barangays</span> in the pilot
                <br />
                Jaro · La Paz · Mandurriao
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="flex justify-center md:justify-end">
            <PhoneMock kind="confirm" />
          </Reveal>
        </div>
      </div>

      {/* Rules — a specs strip, not an icon grid */}
      <div className="border-t border-white/10 bg-ink px-7 py-10 md:px-16 md:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="font-mono text-[11px] font-bold uppercase tracking-widest text-slate-500">
            Three rules, no exceptions
          </div>
          <div className="mt-6 grid grid-cols-1 divide-y divide-white/10 md:grid-cols-3 md:divide-x md:divide-y-0">
            {RULES.map((r, i) => (
              <Reveal key={r.title} delay={i * 0.05} className="flex flex-col gap-2 py-5 first:pt-0 md:px-8 md:py-0 md:first:pl-0 md:last:pr-0">
                <span className="font-mono text-[28px] font-extrabold text-brand">{r.stat}</span>
                <div className="text-[15px] font-bold text-white">{r.title}</div>
                <div className="text-[13px] leading-snug text-slate-400">{r.body}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      {/* Feature rows — alternating mock + copy, on the paper sheet */}
      <div className="rounded-t-[28px] bg-paper px-7 pb-4 pt-12 text-ink md:px-16 md:pt-20">
        <div className="mx-auto flex max-w-5xl flex-col gap-16 md:gap-24">
          {FEATURE_ROWS.map((row, i) => (
            <Reveal
              key={row.tag}
              className={`flex flex-col items-center gap-6 md:gap-16 ${i % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'}`}
            >
              <div className="flex-1">
                <PhoneMock kind={row.mock} />
              </div>
              <div className="flex-1 text-center md:text-left">
                <div className="font-mono text-[11px] font-bold uppercase tracking-widest text-brand">
                  {row.tag}
                </div>
                <h3 className="mt-2 text-[20px] font-extrabold leading-snug md:text-[28px]">{row.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-slate md:max-w-[420px] md:text-[16px]">
                  {row.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* How it works — on the paper sheet, Operate-style, same as the rest of the app */}
      <div id="how-it-works" className="bg-paper px-7 pb-16 pt-10 text-ink md:px-16 md:pb-24 md:pt-20">
        <div className="mx-auto max-w-6xl">
          <div className="font-mono text-[11px] font-bold uppercase tracking-widest text-slate-400">
            How it works
          </div>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 md:gap-x-12">
            {STEPS.map(([num, title, body]) => (
              <div key={num} className="flex gap-4 border-b border-mist py-4 last:border-0">
                <span className="font-mono text-[13px] font-bold text-slate-400">{num}</span>
                <div>
                  <div className="text-[15px] font-bold">{title}</div>
                  <div className="mt-0.5 text-[13px] leading-snug text-slate">{body}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 max-w-3xl rounded-xl bg-mist px-4 py-3 text-[12.5px] leading-snug text-slate">
            This isn&apos;t a ride-hailing app. There&apos;s no matching, booking, or payment &mdash; you
            still arrange rides yourselves. &ldquo;ID-verified&rdquo; means an administrator checked a
            government or school ID. It is not a safety guarantee.
          </div>

          <Link to="/register" className="mt-6 inline-flex items-center gap-1 text-[12px] font-bold text-brand-dark">
            Register <ArrowRight size={14} strokeWidth={2.2} />
          </Link>
        </div>
      </div>

      {/* Manifesto */}
      <div className="bg-paper px-7 py-14 text-ink md:px-16 md:py-24">
        <div className="mx-auto flex max-w-3xl flex-col gap-8">
          <div className="font-mono text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Why RideSentinel
          </div>
          {MANIFESTO.map((line, i) => (
            <Reveal
              as="p"
              key={line}
              delay={i * 0.05}
              className={
                i === MANIFESTO.length - 1
                  ? 'text-[20px] font-bold leading-snug md:text-[26px]'
                  : 'text-[16px] leading-relaxed text-slate md:text-[19px]'
              }
            >
              {line}
            </Reveal>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div id="faq" className="border-t border-mist bg-paper px-7 py-14 text-ink md:px-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <div className="font-mono text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Questions
          </div>
          <div className="mt-5 flex flex-col">
            {FAQ.map(([q, a], i) => {
              const open = openFaq === i
              return (
                <div key={q} className="border-b border-mist py-4 last:border-0">
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="flex w-full items-center justify-between text-left"
                    aria-expanded={open}
                  >
                    <span className="text-[15px] font-bold md:text-[17px]">{q}</span>
                    <Plus
                      size={18}
                      className={cn('flex-shrink-0 text-slate-400 transition-transform', open && 'rotate-45')}
                    />
                  </button>
                  {open && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.18 }}
                      className="mt-2 text-[13.5px] leading-snug text-slate md:text-[15px]"
                    >
                      {a}
                    </motion.p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Closing CTA */}
      <div className="bg-ink px-7 py-16 text-center text-white md:px-16 md:py-24">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-[26px] font-extrabold leading-tight md:text-[36px]">
            Know who you&apos;re meeting.
          </h2>
          <p className="mt-2 text-[14px] text-slate-400 md:text-[16px]">
            Takes a day to verify. Takes a minute to confirm.
          </p>
          <div className="mx-auto mt-7 flex max-w-sm flex-col gap-2.5 md:max-w-none md:flex-row">
            <Link
              to="/register"
              className={cn(buttonVariants({ variant: 'heroPrimary', size: 'lg' }), 'md:flex-1')}
            >
              Register
            </Link>
            <Link
              to="/login"
              className={cn(buttonVariants({ variant: 'heroOutline', size: 'lg' }), 'md:flex-1')}
            >
              Log in
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 bg-ink px-7 py-10 text-slate-500 md:px-16">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-[12.5px] font-semibold">
            <Link to="/consent" className="hover:text-white">
              Privacy &amp; Terms
            </Link>
            <Link to="/report" className="hover:text-white">
              Report something
            </Link>
            <Link to="/admin" className="hover:text-white">
              Admin
            </Link>
          </div>
          <div className="font-mono text-[11px]">
            RideSentinel · Pilot — Jaro / La Paz / Mandurriao, Iloilo City
          </div>
        </div>
      </div>
    </div>
  )
}
