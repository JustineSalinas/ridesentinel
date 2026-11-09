import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '@/components/app-shell'
import { PlaceholderScreen } from '@/components/placeholder-screen'
import { RequireAuth, RequireAdmin } from '@/components/require-auth'
import { LandingPage } from '@/features/marketing/landing-page'
import { AuthPage } from '@/features/auth/auth-page'
import { ConsentPage } from '@/features/auth/consent-page'
import { HomePage } from '@/features/dashboard/home-page'
import { AdminHomePage } from '@/features/admin/admin-home-page'

// Routing for docs/SPEC.md §7. Landing, Auth, Consent, Home and the Admin
// dashboard are built; everything else is still a placeholder until the
// milestone named in §14 builds it.

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <AuthPage initialTab="login" /> },
  { path: '/register', element: <AuthPage initialTab="register" /> },
  { path: '/verify', element: <PlaceholderScreen title="Verify ID + Selfie" milestone="M2" /> },
  { path: '/verify/status', element: <PlaceholderScreen title="Verification Status" milestone="M2" /> },

  {
    element: <RequireAuth />,
    children: [
      { path: '/consent', element: <ConsentPage /> },
      {
        element: <AppShell />,
        children: [
          { path: '/home', element: <HomePage /> },
          { path: '/qr', element: <PlaceholderScreen title="My QR" milestone="M3" /> },
          { path: '/scan', element: <PlaceholderScreen title="Scan" milestone="M3" /> },
          { path: '/scan/result/:id', element: <PlaceholderScreen title="Scanned Profile" milestone="M3" /> },
          { path: '/interactions', element: <PlaceholderScreen title="Interactions" milestone="M3" /> },
          { path: '/rate/:interactionId', element: <PlaceholderScreen title="Rate" milestone="M4" /> },
          { path: '/profile', element: <PlaceholderScreen title="My Profile" milestone="M2" /> },
          { path: '/report', element: <PlaceholderScreen title="Report" milestone="M4" /> },
        ],
      },
    ],
  },

  {
    element: <RequireAdmin />,
    children: [
      { path: '/admin', element: <AdminHomePage /> },
      { path: '/admin/verifications', element: <PlaceholderScreen title="Admin: Verification Review" milestone="M2" /> },
      { path: '/admin/verifications/:id', element: <PlaceholderScreen title="Admin: Verification Detail" milestone="M2" /> },
      { path: '/admin/reports', element: <PlaceholderScreen title="Admin: Reports" milestone="M4" /> },
      { path: '/admin/reports/:id', element: <PlaceholderScreen title="Admin: Report Detail" milestone="M4" /> },
      { path: '/admin/audit', element: <PlaceholderScreen title="Admin: Audit Log" milestone="M2" /> },
    ],
  },

  { path: '*', element: <PlaceholderScreen title="Not found" milestone="—" /> },
])
