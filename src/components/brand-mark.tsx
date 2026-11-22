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
        className="relative flex h-9 w-9 items-center justify-center rounded-[10px] text-white shadow-[0_1px_2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.25)]"
        style={{ background: 'linear-gradient(145deg, var(--color-brand) 0%, var(--color-brand-dark) 100%)' }}
        aria-hidden="true"
      >
        <Motorbike size={19} strokeWidth={2.2} />
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

