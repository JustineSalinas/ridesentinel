import { defineConfig } from 'vitest/config'

// Separate from the root vite.config.ts (jsdom, for React components) —
// convex-test needs the edge-runtime environment per its own docs.
export default defineConfig({
  test: {
    environment: 'edge-runtime',
    include: ['convex/**/*.test.ts'],
    server: { deps: { inline: ['convex-test'] } },
  },
})
