import { Outlet } from 'react-router-dom'
import { OfflineBanner } from './offline-banner'
import { BottomTabBar } from './bottom-tab-bar'

/** Mobile-first shell (SPEC.md §7): offline banner on every screen, bottom tabs for the four main sections. */
export function AppShell() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-mist">
      <OfflineBanner />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Outlet />
      </div>
      <BottomTabBar />
    </div>
  )
}
