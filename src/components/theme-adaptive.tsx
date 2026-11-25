import { Outlet } from 'react-router-dom'

// Scopes the dark-mode toggle's CSS variable overrides (src/index.css) to
// exactly the light-canvas screens that should flip with it — everything
// under this layout route. Screens that are ALWAYS dark by design (Auth,
// Landing, My QR, Scan, the admin console) stay outside it on purpose:
// they hardcode `bg-ink`/`text-white` combinations that would turn
// unreadable if --color-ink flipped to a light value under them too.
// `display: contents` keeps this purely a CSS-variable scope — no layout
// box, no visual effect of its own.
export function ThemeAdaptive() {
  return (
    <div className="theme-adaptive contents">
      <Outlet />
    </div>
  )
}
