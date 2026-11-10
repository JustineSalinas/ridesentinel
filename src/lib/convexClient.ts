import { ConvexReactClient } from 'convex/react'
import { api } from '../../convex/_generated/api'

const convexUrl = import.meta.env.VITE_CONVEX_URL

if (!convexUrl) {
  throw new Error('Missing VITE_CONVEX_URL. Copy .env.example to .env.local and run `npx convex dev`.')
}

export const convex = new ConvexReactClient(convexUrl)

// Dev/e2e-only bridge (SPEC.md §12: "inject token, or use a fake camera" —
// this is the inject-token path). Never present in a production build —
// import.meta.env.DEV is statically replaced by Vite, so this whole block
// is dead-code-eliminated from `vite build`.
if (import.meta.env.DEV) {
  ;(window as unknown as { __convex: typeof convex; __convexApi: typeof api }).__convex = convex
  ;(window as unknown as { __convex: typeof convex; __convexApi: typeof api }).__convexApi = api
}
