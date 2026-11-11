import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'

const RULES = [
  {
    tag: '60S',
    title: 'QR codes expire',
    body: 'Every code is one-time and dies in a minute. A screenshot is useless.',
  },
  {
    tag: 'x2',
    title: 'Ratings need a confirmed meeting',
    body: 'Both people have to confirm, in person, before either can rate the other.',
  },
  {
    tag: 'DB',
    title: 'The server decides what’s true',
    body: 'Tier, verification, and ratings are never decided by your phone.',
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
    <div className="relative mx-auto h-[280px] w-[160px] rounded-[26px] border-[6px] border-ink bg-paper shadow-[0_20px_40px_-20px_rgba(15,23,42,0.35)]">
      <div className="absolute left-1/2 top-0 h-4 w-16 -translate-x-1/2 rounded-b-xl bg-ink" />
      <div className="flex h-full flex-col items-center justify-center gap-2 px-4 pt-3">
        {kind === 'qr' && (
          <>
            <div className="grid h-20 w-20 grid-cols-4 grid-rows-4 gap-[3px] rounded-md bg-ink p-2">
              {Array.from({ length: 16 }).map((_, i) => (
                <span key={i} className={i % 3 === 0 ? 'rounded-[1px] bg-white' : 'rounded-[1px] bg-transparent'} />
              ))}
            </div>
            <div className="rounded-full bg-mist px-2.5 py-1 text-[9px] font-bold text-slate">Refreshes in 42s</div>
          </>
        )}
        {kind === 'confirm' && (
          <>
            <div className="h-16 w-16 rounded-full bg-mist" />
            <div className="text-[11px] font-bold text-ink">Marco D.</div>
            <div className="rounded-full bg-green-50 px-2 py-0.5 text-[9px] font-bold text-verified">
              ✓ ID-verified
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
                <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i < 4 ? '#D97706' : 'none'}>
                  <path
                    d="M12 2l2.9 6.3L22 9l-5 5 1.3 7L12 17.8 5.7 21 7 14 2 9l7.1-.7L12 2z"
                    stroke="#D97706"
                    strokeWidth="1"
                  />
                </svg>
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

export function LandingPage() {
  const reduceMotion = useReducedMotion()
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <div className="min-h-dvh bg-ink text-white">
      {/* Hero */}
      <div className="relative overflow-hidden px-7 pb-16 pt-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, #fff 0 1px, transparent 1px 28px), repeating-linear-gradient(90deg, #fff 0 1px, transparent 1px 28px)',
          }}
          aria-hidden="true"
        />
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="relative mx-auto max-w-md"
        >
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold tracking-[0.18em] text-pending">
            <span className="h-1.5 w-1.5 rounded-full bg-pending" />
            PILOT · ILOILO CITY
          </div>
          <h1 className="mt-3 text-[38px] font-extrabold leading-[1.05] tracking-tight">
            Ride<span className="text-brand">Sentinel</span>
          </h1>
          <p className="mt-3 max-w-[300px] text-[15px] leading-snug text-slate-300">
            A motorcycle ride is arranged in a chat. Before you get on, know who you&apos;re actually
            meeting.
          </p>

          <div className="mt-8 flex flex-col gap-2.5">
            <Link
              to="/register"
              className="group flex h-[54px] items-center justify-between rounded-full bg-brand px-6 text-[15px] font-bold text-white transition-colors hover:bg-brand-dark"
            >
              Register
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition-transform group-hover:translate-x-0.5">
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
            </Link>
            <Link
              to="/login"
              className="flex h-[54px] items-center justify-center rounded-full border border-white/15 text-[15px] font-bold text-white"
            >
              Log in
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Rules */}
      <div className="border-t border-white/10 bg-ink px-7 py-10">
        <div className="mx-auto max-w-md">
          <div className="font-mono text-[11px] font-bold uppercase tracking-widest text-slate-500">
            Three rules, no exceptions
          </div>
          <div className="mt-5 flex flex-col gap-5">
            {RULES.map((r) => (
              <div key={r.title} className="flex gap-4">
                <span className="mt-0.5 flex h-7 w-10 flex-shrink-0 items-center justify-center rounded-md border border-white/15 font-mono text-[11px] font-bold text-brand">
                  {r.tag}
                </span>
                <div>
                  <div className="text-[15px] font-bold">{r.title}</div>
                  <div className="mt-0.5 text-[13px] leading-snug text-slate-400">{r.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature rows — alternating mock + copy, on the paper sheet */}
      <div className="rounded-t-[28px] bg-paper px-7 pb-4 pt-12 text-ink">
        <div className="mx-auto flex max-w-md flex-col gap-16">
          {FEATURE_ROWS.map((row, i) => (
            <motion.div
              key={row.tag}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.35 }}
              className={`flex flex-col items-center gap-6 ${i % 2 === 1 ? 'sm:flex-row-reverse' : 'sm:flex-row'}`}
            >
              <div className="flex-1">
                <PhoneMock kind={row.mock} />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <div className="font-mono text-[11px] font-bold uppercase tracking-widest text-brand">
                  {row.tag}
                </div>
                <h3 className="mt-2 text-[20px] font-extrabold leading-snug">{row.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-slate">{row.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* How it works — on the paper sheet, Operate-style, same as the rest of the app */}
      <div className="bg-paper px-7 pb-16 pt-10 text-ink">
        <div className="mx-auto max-w-md">
          <div className="font-mono text-[11px] font-bold uppercase tracking-widest text-slate-400">
            How it works
          </div>
          <div className="mt-5 flex flex-col">
            {STEPS.map(([num, title, body], i) => (
              <div key={num} className="flex gap-4 border-b border-mist py-4 last:border-0">
                <span className="font-mono text-[13px] font-bold text-slate-400">{num}</span>
                <div>
                  <div className="text-[15px] font-bold">{title}</div>
                  <div className="mt-0.5 text-[13px] leading-snug text-slate">{body}</div>
                </div>
                <span className="ml-auto self-center text-slate-300">{i < STEPS.length - 1 ? '↓' : ''}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl bg-mist px-4 py-3 text-[12.5px] leading-snug text-slate">
            This isn&apos;t a ride-hailing app. There&apos;s no matching, booking, or payment &mdash; you
            still arrange rides yourselves. &ldquo;ID-verified&rdquo; means an administrator checked a
            government or school ID. It is not a safety guarantee.
          </div>

          <Link to="/register" className="mt-6 inline-block font-mono text-[12px] font-bold text-brand-dark">
            REGISTER →
          </Link>
        </div>
      </div>

      {/* Manifesto */}
      <div className="bg-paper px-7 py-14 text-ink">
        <div className="mx-auto flex max-w-md flex-col gap-8">
          <div className="font-mono text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Why RideSentinel
          </div>
          {MANIFESTO.map((line, i) => (
            <motion.p
              key={i}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className={i === MANIFESTO.length - 1 ? 'text-[20px] font-bold leading-snug' : 'text-[16px] leading-relaxed text-slate'}
            >
              {line}
            </motion.p>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="border-t border-mist bg-paper px-7 py-14 text-ink">
        <div className="mx-auto max-w-md">
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
                    <span className="text-[15px] font-bold">{q}</span>
                    <span className={'ml-4 flex-shrink-0 text-slate-400 transition-transform' + (open ? ' rotate-45' : '')}>
                      +
                    </span>
                  </button>
                  {open && (
                    <motion.p
                      initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.18 }}
                      className="mt-2 text-[13.5px] leading-snug text-slate"
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
      <div className="bg-ink px-7 py-16 text-center text-white">
        <div className="mx-auto max-w-md">
          <h2 className="text-[26px] font-extrabold leading-tight">Know who you&apos;re meeting.</h2>
          <p className="mt-2 text-[14px] text-slate-400">Takes a day to verify. Takes a minute to confirm.</p>
          <div className="mt-7 flex flex-col gap-2.5">
            <Link
              to="/register"
              className="flex h-[54px] items-center justify-center rounded-full bg-brand text-[15px] font-bold text-white transition-colors hover:bg-brand-dark"
            >
              Register
            </Link>
            <Link
              to="/login"
              className="flex h-[54px] items-center justify-center rounded-full border border-white/15 text-[15px] font-bold text-white"
            >
              Log in
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 bg-ink px-7 py-10 text-slate-500">
        <div className="mx-auto flex max-w-md flex-col gap-4">
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
