import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * iPhone device frame — structure mirrors the phone mock from the sibling
 * Famly project (famly-app.vercel.app): flat solid-color bezel (not a
 * metallic gradient), a 300:652 aspect ratio, and a dynamic island with a
 * camera dot. Proportions below are percentages of that reference's exact
 * px values (e.g. frame 12px / 300px width, island 82px / 300px width).
 */
export function PhoneMock({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn('relative mx-auto aspect-[300/652] w-[280px]', className)}
      role="img"
      aria-label="RideSentinel app shown on an iPhone"
    >
      <div
        className="relative h-full w-full rounded-[18.7%] bg-[#1c1d24] p-[4%] shadow-[0_40px_80px_-24px_rgba(0,0,0,0.65)]"
        style={{ boxShadow: 'inset 0 0 4px 2px rgba(255,255,255,0.1)' }}
      >
        <div className="relative h-full w-full overflow-hidden rounded-[15%] bg-[#f8fafc]">
          {/* Dynamic island, camera dot included */}
          <div
            className="absolute left-1/2 top-[1.75%] z-50 h-[3.5%] w-[27.3%] -translate-x-1/2 rounded-full bg-black"
            style={{ boxShadow: 'inset 0 0 2px rgba(255,255,255,0.2)' }}
          >
            <span
              className="absolute right-[22%] top-1/2 h-[23%] w-[6%] -translate-y-1/2 rounded-full bg-[#111]"
              style={{ boxShadow: 'inset 0 0 1px rgba(255,255,255,0.4)' }}
              aria-hidden="true"
            />
          </div>

          {/* Screen */}
          <div className="flex h-full w-full flex-col overflow-hidden">
            {/* Status bar */}
            <div className="z-40 flex shrink-0 items-center justify-between px-[4.7%] pt-[1.5%] text-[10px] font-semibold text-slate-900">
              <span className="tracking-tight">9:41</span>
              <div className="flex items-center gap-1.5 text-slate-900">
                <svg className="h-2.5 w-3" viewBox="0 0 18 12" fill="currentColor">
                  <rect x="0" y="9" width="2" height="3" rx="0.5" />
                  <rect x="3.5" y="7" width="2" height="5" rx="0.5" />
                  <rect x="7" y="4" width="2" height="8" rx="0.5" />
                  <rect x="10.5" y="2" width="2" height="12" rx="0.5" />
                  <rect x="14" y="0" width="2" height="12" rx="0.5" />
                </svg>
                <svg className="h-2.5 w-3" viewBox="0 0 16 12" fill="currentColor">
                  <path d="M8 12a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm-4.2-4.2a6 6 0 0 1 8.4 0l-1.4 1.4a4 4 0 0 0-5.6 0l-1.4-1.4zm-2.8-2.8a10 10 0 0 1 14 0l-1.4 1.4a8 8 0 0 0-11.2 0l-1.4-1.4z" />
                </svg>
                <div className="flex items-center gap-0.5">
                  <div className="flex h-2.5 w-5 items-center rounded-[3px] border border-slate-900 p-px">
                    <div className="h-full w-full rounded-[1px] bg-slate-900" />
                  </div>
                  <div className="h-0.75 w-[1px] rounded-r-xs bg-slate-900" />
                </div>
              </div>
            </div>

            {/* App content — clears the dynamic island, fills the rest of the screen */}
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pt-[1%]">{children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
