import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * iPhone 16 Pro Max device frame — 430x932 logical points (the real reported
 * viewport size). Thin flat titanium rail (not a thick rounded bezel), a
 * screen corner radius concentric with the body, and the real button layout:
 * Action button + volume rocker on the left, Camera Control + side button on
 * the right.
 */
export function PhoneMock({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn('relative mx-auto aspect-[430/932] w-[280px]', className)}
      role="img"
      aria-label="RideSentinel app shown on an iPhone 16 Pro Max"
    >
      {/* Left rail: Action button, volume up, volume down */}
      <div className="absolute -left-[1.5px] top-[14%] h-[3.5%] w-[1.5px] rounded-l-[1px] bg-[#2c2d30]" />
      <div className="absolute -left-[1.5px] top-[20.5%] h-[6.5%] w-[1.5px] rounded-l-[1px] bg-[#2c2d30]" />
      <div className="absolute -left-[1.5px] top-[28.5%] h-[6.5%] w-[1.5px] rounded-l-[1px] bg-[#2c2d30]" />
      {/* Right rail: side button, Camera Control */}
      <div className="absolute -right-[1.5px] top-[19%] h-[8%] w-[1.5px] rounded-r-[1px] bg-[#2c2d30]" />
      <div className="absolute -right-[1.5px] top-[31%] h-[5.5%] w-[1.5px] rounded-r-[1px] bg-[#2c2d30]" />

      {/* Titanium frame — thin, flat rail (not a thick rounded bezel) */}
      <div className="absolute inset-0 rounded-[15%] bg-gradient-to-br from-[#5a5c60] via-[#333437] to-[#242528] p-[1.6%] shadow-[0_40px_80px_-24px_rgba(0,0,0,0.65)]">
        <div className="relative h-full w-full overflow-hidden rounded-[13.5%] bg-black">
          {/* Status bar */}
          <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-[8.5%] pt-[2.8%] text-[11px] font-semibold text-white">
            <span>9:41</span>
            <span className="flex items-center gap-1">
              <span className="h-[7px] w-[13px] rounded-[2px] border border-white/90" />
            </span>
          </div>

          {/* Dynamic island */}
          <div className="absolute left-1/2 top-[1.6%] z-20 h-[2.9%] w-[25%] -translate-x-1/2 rounded-full bg-black ring-1 ring-white/10" />

          {/* Screen content — padded top clears the status bar + dynamic island, fills the rest */}
          <div className="flex h-full w-full flex-col overflow-y-auto overflow-x-hidden rounded-[13.5%] pt-[10%]">
            <div className="min-h-0 flex-1">{children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
