import { Link } from 'react-router-dom'

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

export function LandingPage() {
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
        <div className="relative mx-auto max-w-md">
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
        </div>
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

      {/* How it works — on the paper sheet, Operate-style, same as the rest of the app */}
      <div className="rounded-t-[28px] bg-paper px-7 pb-16 pt-10 text-ink">
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
    </div>
  )
}
