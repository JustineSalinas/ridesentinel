import { cn } from '@/lib/utils'

/** Crisp geometric RideSentinel mark + wordmark (no glow blobs). */
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
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M10 2L3.75 4.65V9.4C3.75 13.65 6.35 17.3 10 18.4C13.65 17.3 16.25 13.65 16.25 9.4V4.65L10 2Z"
            fill="currentColor"
            fillOpacity="0.16"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M7 10.1L9.1 12.2L13.2 7.9"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
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

