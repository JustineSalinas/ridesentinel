import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** iPhone 16 Pro Max device frame — 430x932 logical points, the real reported viewport size. */
export function PhoneMock({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn('relative mx-auto aspect-[430/932] w-[280px]', className)}
      role="img"
      aria-label="RideSentinel app shown on an iPhone 16 Pro Max"
    >
      {/* Side buttons */}
      <div className="absolute -left-[2px] top-[17%] h-[4%] w-[3px] rounded-l-sm bg-[#1a1b1e]" />
      <div className="absolute -left-[2px] top-[23%] h-[7%] w-[3px] rounded-l-sm bg-[#1a1b1e]" />
      <div className="absolute -left-[2px] top-[31%] h-[7%] w-[3px] rounded-l-sm bg-[#1a1b1e]" />
      <div className="absolute -right-[2px] top-[21%] h-[9%] w-[3px] rounded-r-sm bg-[#1a1b1e]" />

      {/* Metallic bezel */}
      <div className="absolute inset-0 rounded-[13%] bg-gradient-to-b from-[#4a4d52] via-[#2a2b2e] to-[#1a1b1e] p-[3%] shadow-[0_40px_80px_-24px_rgba(0,0,0,0.65)]">
        <div className="relative h-full w-full overflow-hidden rounded-[11%] bg-black">
          {/* Status bar */}
          <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-[9%] pt-[3%] text-[11px] font-semibold text-white">
            <span>9:41</span>
            <span className="flex items-center gap-1">
              <span className="h-[7px] w-[13px] rounded-[2px] border border-white/90" />
            </span>
          </div>

          {/* Dynamic island */}
          <div className="absolute left-1/2 top-[1.8%] z-20 h-[3.2%] w-[28%] -translate-x-1/2 rounded-full bg-black ring-1 ring-white/10" />

          {/* Screen content — padded top clears the status bar + dynamic island */}
          <div className="h-full w-full overflow-y-auto overflow-x-hidden rounded-[11%] pt-[11%]">{children}</div>
        </div>
      </div>
    </div>
  )
}
