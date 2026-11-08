import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/app-shell'
import { PlaceholderScreen } from '@/components/placeholder-screen'

// Routing skeleton for M0 (docs/SPEC.md §7, §14). Each screen below is a
// placeholder until the milestone named in docs/DECISIONS.md / §14 builds it —
// no feature logic belongs here yet.

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <PlaceholderScreen title="Login / Register" milestone="M2" /> },
  { path: '/register', element: <PlaceholderScreen title="Login / Register" milestone="M2" /> },
  { path: '/consent', element: <PlaceholderScreen title="Consent & Terms" milestone="M2" /> },
  { path: '/verify', element: <PlaceholderScreen title="Verify ID + Selfie" milestone="M2" /> },
  { path: '/verify/status', element: <PlaceholderScreen title="Verification Status" milestone="M2" /> },

  {
    element: <AppShell />,
    children: [
      { path: '/home', element: <PlaceholderScreen title="Home Dashboard" milestone="M2" /> },
      { path: '/qr', element: <PlaceholderScreen title="My QR" milestone="M3" /> },
      { path: '/scan', element: <PlaceholderScreen title="Scan" milestone="M3" /> },
      { path: '/scan/result/:id', element: <PlaceholderScreen title="Scanned Profile" milestone="M3" /> },
      { path: '/interactions', element: <PlaceholderScreen title="Interactions" milestone="M3" /> },
      { path: '/rate/:interactionId', element: <PlaceholderScreen title="Rate" milestone="M4" /> },
      { path: '/profile', element: <PlaceholderScreen title="My Profile" milestone="M2" /> },
      { path: '/report', element: <PlaceholderScreen title="Report" milestone="M4" /> },
    ],
  },

  { path: '/admin', element: <PlaceholderScreen title="Admin Home" milestone="M2" /> },
  { path: '/admin/verifications', element: <PlaceholderScreen title="Admin: Verification Review" milestone="M2" /> },
  { path: '/admin/verifications/:id', element: <PlaceholderScreen title="Admin: Verification Detail" milestone="M2" /> },
  { path: '/admin/reports', element: <PlaceholderScreen title="Admin: Reports" milestone="M4" /> },
  { path: '/admin/reports/:id', element: <PlaceholderScreen title="Admin: Report Detail" milestone="M4" /> },
  { path: '/admin/audit', element: <PlaceholderScreen title="Admin: Audit Log" milestone="M2" /> },

  { path: '*', element: <PlaceholderScreen title="Not found" milestone="—" /> },
])
