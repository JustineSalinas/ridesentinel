import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '@/components/app-shell'
import { PlaceholderScreen } from '@/components/placeholder-screen'
import { RequireAuth, RequireAdmin } from '@/components/require-auth'
import { LandingPage } from '@/features/marketing/landing-page'
import { AuthPage } from '@/features/auth/auth-page'
import { ConsentPage } from '@/features/auth/consent-page'
import { VerifyPage } from '@/features/verification/verify-page'
import { HomePage } from '@/features/dashboard/home-page'
import { MyQrPage } from '@/features/qr/my-qr-page'
import { ScanResultPage } from '@/features/qr/scan-result-page'

// html5-qrcode is the single biggest dependency in the bundle and only
// ScanPage needs it — lazy-load it so /home's first load doesn't pay for it.
const ScanPage = lazy(() => import('@/features/qr/scan-page').then((m) => ({ default: m.ScanPage })))
import { InteractionsPage } from '@/features/interactions/interactions-page'
import { RatePage } from '@/features/ratings/rate-page'
import { ReportPage } from '@/features/reports/report-page'
import { ProfilePage } from '@/features/profile/profile-page'
import { AdminHomePage } from '@/features/admin/admin-home-page'
import { AdminVerificationsPage } from '@/features/admin/admin-verifications-page'
import { AdminReportsPage } from '@/features/admin/admin-reports-page'
import { AdminAuditPage } from '@/features/admin/admin-audit-page'

// Routing for docs/SPEC.md §7 — every screen is built. My QR/Scan/Scan
// Result/Rate/Report live outside AppShell: they're full-screen flows with
// their own back navigation, not tab-bar destinations, matching the
// approved prototype.

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <AuthPage initialTab="login" /> },
  { path: '/register', element: <AuthPage initialTab="register" /> },
  {
    element: <RequireAuth />,
    children: [
      { path: '/consent', element: <ConsentPage /> },
      { path: '/verify', element: <VerifyPage /> },
      { path: '/verify/status', element: <VerifyPage /> },
      { path: '/qr', element: <MyQrPage /> },
      {
        path: '/scan',
        element: (
          <Suspense fallback={<div className="flex flex-1 items-center justify-center bg-ink text-slate-400">Loading…</div>}>
            <ScanPage />
          </Suspense>
        ),
      },
      { path: '/scan/result/:id', element: <ScanResultPage /> },
      { path: '/interactions', element: <InteractionsPage /> },
      { path: '/rate/:interactionId', element: <RatePage /> },
      { path: '/report', element: <ReportPage /> },
      {
        element: <AppShell />,
        children: [
          { path: '/home', element: <HomePage /> },
          { path: '/profile', element: <ProfilePage /> },
        ],
      },
    ],
  },

  {
    element: <RequireAdmin />,
    children: [
      { path: '/admin', element: <AdminHomePage /> },
      { path: '/admin/verifications', element: <AdminVerificationsPage /> },
      { path: '/admin/reports', element: <AdminReportsPage /> },
      { path: '/admin/audit', element: <AdminAuditPage /> },
    ],
  },

  { path: '*', element: <PlaceholderScreen title="Not found" milestone="—" /> },
])
