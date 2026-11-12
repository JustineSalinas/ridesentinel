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
    <div className="relative mx-auto h-[300px] w-[172px] rounded-[26px] border-[6px] border-ink bg-paper shadow-[0_20px_40px_-20px_rgba(15,23,42,0.35)]">
      <div className="absolute left-1/2 top-0 h-4 w-16 -translate-x-1/2 rounded-b-xl bg-ink" />
      <div className="flex h-full flex-col items-center justify-center gap-2 px-4 pt-3">
        {kind === 'qr' && (
          <>
            <div className="flex h-20 w-20 items-center justify-center rounded-md bg-ink">
              <QrCode size={48} strokeWidth={1.5} className="text-white" />
            </div>
            <div className="rounded-full bg-mist px-2.5 py-1 text-[9px] font-bold text-slate">Refreshes in 42s</div>
          </>
        )}
        {kind === 'confirm' && (
          <>
            <div className="h-16 w-16 rounded-full bg-mist" />
            <div className="text-[11px] font-bold text-ink">Marco D.</div>
            <div className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[9px] font-bold text-verified">
              <UserCheck size={10} strokeWidth={2.2} />
              ID-verified
            </div>
            <div className="mt-1 w-full rounded-md bg-brand py-1.5 text-center text-[9px] font-bold text-white">
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
            <div className="mt-1 w-full rounded-md bg-mist py-1.5 text-center text-[9px] text-slate">
              Hidden until you both rate
            </div>
          </>
        )}
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
      {/* Nav — flat, no floating glass pill */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between border-b border-white/10 px-5 py-5 md:px-10">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand">
            <Shield size={15} strokeWidth={2.2} className="text-white" fill="#FFFFFF" />
          </div>
          <span className="text-[14px] font-extrabold tracking-tight">RideSentinel</span>
        </div>
        <div className="hidden items-center gap-7 text-[13px] font-semibold text-slate-300 md:flex">
          <a href="#how-it-works" className="hover:text-white">
            How it works
          </a>
          <a href="#faq" className="hover:text-white">
            FAQ
          </a>
        </div>
        <div className="flex items-center gap-5">
          <Link to="/login" className="hidden text-[13px] font-semibold text-white hover:text-slate-300 md:block">
            Log in
          </Link>
          <Link to="/register" className={cn(buttonVariants({ variant: 'heroPrimary', size: 'pill' }))}>
            Register
          </Link>
        </div>
      </nav>

      {/* Hero — asymmetric two-column, no decoration */}
      <div className="px-5 py-14 md:px-10 md:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-[1.1fr_0.9fr] md:gap-16">
          <Reveal>
            <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-pending">
              Pilot · Iloilo City
            </div>
            <h1 className="mt-4 text-[38px] font-bold leading-[1.1] tracking-tight text-slate-400 md:text-[52px]">
              Know who you&apos;re <span className="font-extrabold text-white">meeting</span>{' '}
              <span className="font-extrabold text-white">before you ride.</span>
            </h1>
            <p className="mt-5 max-w-[440px] text-[15px] leading-snug text-slate-400 md:text-[17px]">
              A motorcycle ride is arranged in a chat. RideSentinel confirms, with a verified photo and a
              live QR handshake, that the person who shows up is actually them.
            </p>

            <div className="mt-8 flex max-w-sm flex-col gap-2.5 sm:flex-row">
              <Link to="/register" className={cn(buttonVariants({ variant: 'heroPrimary', size: 'lg' }), 'px-8')}>
                Register
              </Link>
              <Link to="/login" className={cn(buttonVariants({ variant: 'heroOutline', size: 'lg' }), 'px-8')}>
                Log in
              </Link>
            </div>

            <div className="mt-10 flex gap-8 border-t border-white/10 pt-6 text-[13px] text-slate-400">
              <div>
                <span className="text-[20px] font-extrabold text-white">60s</span> QR expiry
              </div>
              <div>
                <span className="text-[20px] font-extrabold text-white">48h</span> rating window
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
