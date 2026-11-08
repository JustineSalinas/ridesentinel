import { ConvexReactClient } from 'convex/react'

const convexUrl = import.meta.env.VITE_CONVEX_URL

if (!convexUrl) {
  throw new Error('Missing VITE_CONVEX_URL. Copy .env.example to .env.local and run `npx convex dev`.')
}

export const convex = new ConvexReactClient(convexUrl)
