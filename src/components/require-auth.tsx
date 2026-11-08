import { useConvexAuth, useQuery } from 'convex/react'
import { Navigate, Outlet } from 'react-router-dom'
import { api } from '../../convex/_generated/api'

/**
 * Client-side route guards. These are convenience/UX only — the real
 * authorization lives in each Convex function (convex/lib/authz.ts). A
 * user who bypasses this still can't call an admin mutation and succeed.
 */

export function RequireAuth() {
  const { isLoading, isAuthenticated } = useConvexAuth()
  if (isLoading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Outlet />
}

export function RequireAdmin() {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const me = useQuery(api.profiles.getMe, isAuthenticated ? {} : 'skip')

  if (isLoading || (isAuthenticated && me === undefined)) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!me || me.role !== 'admin') return <Navigate to="/home" replace />
  return <Outlet />
}
