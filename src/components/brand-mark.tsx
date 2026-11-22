import { Motorbike } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Rider mark (Lucide's open-source Motorbike icon) + wordmark. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn('inline-flex items-center gap-2.5', className)}>
      <span
        className="relative flex h-9 w-9 items-center justify-center rounded-[10px] text-white shadow-[0_3px_8px_rgba(23,37,84,0.4),inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-1px_0_rgba(0,0,0,0.15)]"
        style={{ background: 'linear-gradient(155deg, var(--color-brand) 0%, var(--color-brand-dark) 100%)' }}
        aria-hidden="true"
      >
        <Motorbike size={19} strokeWidth={2.25} />
      </span>
      <span className="font-display text-[17px] font-bold tracking-tight text-white">RideSentinel</span>
    </div>
  )
}

