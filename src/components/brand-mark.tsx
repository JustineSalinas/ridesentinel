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
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white ring-1 ring-inset ring-white/20"
        aria-hidden="true"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M10 2.25L3.5 5.1V9.6C3.5 13.85 6.27 17.65 10 18.75C13.73 17.65 16.5 13.85 16.5 9.6V5.1L10 2.25Z"
            fill="currentColor"
            fillOpacity="0.18"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path
            d="M7.25 10.25L9.15 12.15L13 8.1"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="font-display text-[16px] font-bold tracking-tight text-white">RideSentinel</span>
      {showPilotTag && (
        <span className="hidden rounded border border-white/15 bg-white/[0.06] px-2 py-0.5 font-mono text-xs font-semibold uppercase tracking-wider text-slate-200 min-[380px]:inline-flex">
          Pilot
        </span>
      )}
    </div>
  )
}

