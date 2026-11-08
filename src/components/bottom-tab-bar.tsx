import { NavLink } from 'react-router-dom'
import { Home, QrCode, ScanLine, CircleUserRound } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/qr', label: 'My QR', icon: QrCode },
  { to: '/scan', label: 'Scan', icon: ScanLine },
  { to: '/profile', label: 'Profile', icon: CircleUserRound },
]

export function BottomTabBar() {
  return (
    <nav className="flex border-t border-mist bg-paper px-2 pb-5 pt-2.5">
      {tabs.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center gap-0.5 text-[11px] text-slate/60',
              isActive && 'text-brand',
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={20} strokeWidth={1.8} className={isActive ? 'text-brand' : 'text-slate/60'} />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
