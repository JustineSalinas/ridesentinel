import { Motorbike } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Rider mark (Lucide's open-source Motorbike icon) + wordmark. */
export function BrandMark({
  showPilotTag = false,
  className,
}: {
  showPilotTag?: boolean
  className?: string
}) {
  return (
    <div className={cn('inline-flex items-center gap-2.5', className)}>
      <span
        className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-[10px] text-white shadow-[0_2px_6px_rgba(30,58,138,0.45),inset_0_1px_0_rgba(255,255,255,0.3)]"
        style={{ background: 'linear-gradient(145deg, var(--color-brand) 0%, var(--color-brand-dark) 100%)' }}
        aria-hidden="true"
      >
        {/* Speed lines — a touch of forward motion so the mark doesn't read as a static icon-in-a-box */}
        <svg className="absolute inset-0 h-full w-full opacity-25" viewBox="0 0 36 36" fill="none">
          <path d="M-2 26L12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M2 32L18 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M8 38L26 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <Motorbike size={20} strokeWidth={2.3} className="relative drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]" />
      </span>
      <span className="font-display text-[17px] font-bold tracking-tight text-white">RideSentinel</span>
      {showPilotTag && (
        <span className="hidden rounded border border-white/15 bg-white/[0.06] px-2 py-0.5 font-mono text-xs font-semibold uppercase tracking-wider text-slate-200 min-[380px]:inline-flex">
          Pilot
        </span>
      )}
    </div>
  )
}

