import { ConvexAuthProvider } from '@convex-dev/auth/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { convex } from '@/lib/convexClient'
import { queryClient } from '@/lib/queryClient'
import { router } from '@/routes'

export function App() {
  return (
    <ConvexAuthProvider client={convex}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ConvexAuthProvider>
  )
}
