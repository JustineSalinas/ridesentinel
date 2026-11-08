# RideSentinel

Read `docs/SPEC.md` before any task. Follow its rules, build order (Section 14), and definition of done (Section 16). Log any ambiguous call in `docs/DECISIONS.md`.

Backend is **Convex**, not Supabase — there is no RLS. Every authorization check lives in `convex/lib/authz.ts` and must be called explicitly at the top of each query/mutation (see `docs/SPEC.md` §5).

Quick commands:
- `npx convex dev` — **run this first, once**, interactively (opens a browser login). Generates `convex/_generated/*` and writes `VITE_CONVEX_URL` to `.env.local`. Nothing else below works without it.
- `pnpm dev` — start the Vite dev server
- `pnpm build` — typecheck + production build
- `pnpm lint` — ESLint
- `pnpm test` — Vitest unit/component tests
- `pnpm test:e2e` — Playwright e2e (requires the dev server and a Convex dev deployment)
