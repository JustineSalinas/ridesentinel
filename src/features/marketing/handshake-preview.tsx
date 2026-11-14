import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check, Lock, ShieldCheck, Star, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type StageId = 'qr' | 'confirm' | 'rate'

const STAGES: { id: StageId; label: string; caption: string }[] = [
  {
    id: 'qr',
    label: '60s QR',
    caption: 'Single-use token refreshes automatically before expiry.',
  },
  {
    id: 'confirm',
    label: 'Face check',
    caption: 'Both riders check the verified photo face-to-face at pickup.',
  },
  {
    id: 'rate',
    label: 'Blind rate',
    caption: 'Scores unlock only after both rate, or after 48 hours.',
  },
]

function RiderAvatarSvg() {
  return (
    <svg
      viewBox="0 0 80 80"
      className="h-full w-full"
      role="img"
      aria-label="Sample verified driver portrait"
    >
      <rect width="80" height="80" rx="16" fill="#DBEAFE" />
      <path d="M14 80C14 63.4 25.6 54 40 54C54.4 54 66 63.4 66 80H14Z" fill="#1E293B" />
      <path d="M33 55L40 64L47 55" fill="#2563EB" />
      <rect x="34" y="45" width="12" height="11" rx="5" fill="#E0A882" />
      <circle cx="40" cy="34" r="14" fill="#EAC09E" />
      <path
        d="M26 31C26 22.5 32.3 17 40 17C47.7 17 54 22.5 54 31C51 27.5 46 26 40 26C34 26 29 27.5 26 31Z"
        fill="#0F172A"
      />
      <circle cx="35" cy="34" r="1.4" fill="#0F172A" />
      <circle cx="45" cy="34" r="1.4" fill="#0F172A" />
      <path
        d="M36.5 40.5C38.5 42 41.5 42 43.5 40.5"
        stroke="#9A5B3A"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

export function HandshakePreview({ embedded = false }: { embedded?: boolean }) {
  const [stage, setStage] = useState<StageId>('confirm')
  const reduceMotion = useReducedMotion()
  const activeStage = STAGES.find((s) => s.id === stage) ?? STAGES[1]

  return (
    <div
      className={cn(
        'w-full overflow-hidden bg-[#0B1120]',
        embedded
          ? 'flex h-full flex-col'
          : 'max-w-[390px] rounded-2xl border border-white/15 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.75)]',
      )}
    >
      {/* Flush tab bar — no nested cards */}
      <div
        className="grid shrink-0 grid-cols-3 border-b border-white/10 bg-[#111827]"
        role="tablist"
        aria-label="Pickup handshake preview steps"
      >
        {STAGES.map((item) => {
          const selected = item.id === stage
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setStage(item.id)}
              className={cn(
                'border-b-2 py-3 text-xs font-bold transition-colors',
                selected
                  ? 'border-brand bg-[#0B1120] text-white'
                  : 'border-transparent text-slate-300 hover:bg-white/[0.04] hover:text-white',
              )}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      {/* Screen canvas — flat, single-surface hierarchy */}
      <div className={cn(embedded && 'min-h-0 flex-1')}>
      <AnimatePresence mode="wait">
        {stage === 'qr' && (
          <motion.div
            key="qr"
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className={cn('flex flex-col items-center justify-between bg-ink px-6 py-6 text-center text-white', embedded ? 'h-full' : 'min-h-[340px]')}
          >
            <div className="flex w-full items-center justify-between text-xs">
              <span className="font-mono font-bold uppercase tracking-wider text-slate-300">My QR</span>
              <span className="inline-flex items-center gap-1 font-bold text-green-400">
                <ShieldCheck size={14} />
                ID-verified
              </span>
            </div>

            <div className="my-3 rounded-xl bg-white p-3.5">
              <QRCodeSVG
                value="rs:pilot:iloilo:7F9A2C"
                size={144}
                bgColor="#FFFFFF"
                fgColor="#0F172A"
                level="M"
              />
            </div>

            <div className="w-full space-y-2.5">
              <div className="flex items-center justify-between border-t border-white/10 pt-3 font-mono text-xs">
                <span className="flex items-center gap-2 text-slate-200">
                  <span className="h-2 w-2 rounded-full bg-green-400" />
                  NONCE · 7F9A-2C
                </span>
                <span className="font-bold tabular-nums text-white">00:42</span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[70%] rounded-full bg-brand" />
              </div>
              <div className="text-xs text-slate-300">Screenshot-proof · Auto-rotates every 45s</div>
            </div>
          </motion.div>
        )}

        {stage === 'confirm' && (
          <motion.div
            key="confirm"
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className={cn(
              'flex flex-col justify-between bg-paper text-ink',
              embedded ? 'h-full px-4 py-4' : 'min-h-[340px] px-6 py-5',
            )}
          >
            <div className="flex items-center justify-between gap-2 border-b border-mist pb-3">
              <span
                className={cn(
                  'font-mono font-bold uppercase tracking-wider text-slate',
                  embedded ? 'text-[10px]' : 'text-xs',
                )}
              >
                Scanned rider
              </span>
              <span
                className={cn(
                  'shrink-0 whitespace-nowrap rounded-full bg-green-100 font-bold text-green-800',
                  embedded ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs',
                )}
              >
                12mo badge
              </span>
            </div>

            <div className={cn('flex items-center', embedded ? 'my-3 gap-3' : 'my-4 gap-4')}>
              <div
                className={cn(
                  'flex-shrink-0 overflow-hidden rounded-xl border border-mist',
                  embedded ? 'h-11 w-11' : 'h-16 w-16',
                )}
              >
                <RiderAvatarSvg />
              </div>
              <div className="min-w-0">
                <div className={cn('font-extrabold tracking-tight text-ink', embedded ? 'text-[14px]' : 'text-[17px]')}>
                  Harry V.
                </div>
                <div className={cn('mt-0.5 font-medium text-slate', embedded ? 'text-[11px]' : 'text-[13px]')}>
                  Driver · Jaro pickup
                </div>
                <div
                  className={cn(
                    'mt-1.5 flex flex-wrap items-center gap-1.5 font-mono font-bold text-ink',
                    embedded ? 'text-[10px]' : 'text-xs',
                  )}
                >
                  <span className="inline-flex items-center gap-1 text-amber-700">
                    <Star size={embedded ? 10 : 12} fill="#B45309" />
                    4.9
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate">18 confirmed</span>
                </div>
              </div>
            </div>

            <div className={cn('border-t border-mist', embedded ? 'space-y-2.5 pt-3' : 'space-y-3 pt-4')}>
              <p className={cn('font-medium leading-snug text-slate', embedded ? 'text-[11px]' : 'text-[13px]')}>
                Compare the photo above with the person in front of you before confirming.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div
                  className={cn(
                    'flex items-center justify-center gap-1.5 rounded-xl border border-mist bg-page font-bold text-ink',
                    embedded ? 'py-2 text-[11px]' : 'py-2.5 text-[13px]',
                  )}
                >
                  <X size={embedded ? 12 : 14} strokeWidth={2.4} />
                  Not them
                </div>
                <div
                  className={cn(
                    'flex items-center justify-center gap-1.5 rounded-xl bg-brand font-bold text-white',
                    embedded ? 'py-2 text-[11px]' : 'py-2.5 text-[13px]',
                  )}
                >
                  <Check size={embedded ? 12 : 14} strokeWidth={2.5} />
                  Same person
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {stage === 'rate' && (
          <motion.div
            key="rate"
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className={cn('flex flex-col justify-between bg-paper px-6 py-5 text-ink', embedded ? 'h-full' : 'min-h-[340px]')}
          >
            <div className="flex items-center justify-between border-b border-mist pb-3">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate">
                Confirmed ride
              </span>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 font-mono text-xs font-bold tabular-nums text-amber-800">
                47h 12m left
              </span>
            </div>

            <div className="my-4 text-center">
              <div className="text-[15px] font-extrabold text-ink">How was your ride with Harry?</div>
              <div className="mt-3 flex justify-center gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span
                    key={n}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-mist bg-page"
                  >
                    <Star size={17} className="text-amber-700" fill={n <= 4 ? '#B45309' : 'none'} />
                  </span>
                ))}
              </div>
              <div className="mt-3.5 flex flex-wrap justify-center gap-1.5 text-xs font-semibold">
                <span className="rounded-full border border-brand/30 bg-blue-50 px-2.5 py-1 text-brand-dark">
                  On time
                </span>
                <span className="rounded-full border border-brand/30 bg-blue-50 px-2.5 py-1 text-brand-dark">
                  Safe riding
                </span>
                <span className="rounded-full border border-mist bg-page px-2.5 py-1 text-slate">
                  Helmet ready
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 border-t border-mist pt-3.5 text-xs leading-relaxed text-slate">
              <Lock size={14} className="mt-0.5 flex-shrink-0 text-brand" />
              <span>
                <strong className="font-bold text-ink">Blind reveal:</strong> Harry cannot see your rating
                until he submits his own, or the 48-hour window closes.
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {/* Caption footer */}
      <div className="shrink-0 border-t border-white/10 bg-[#0B1120] px-4 py-2.5 text-xs text-slate-300">
        {activeStage.caption}
      </div>
    </div>
  )
}
