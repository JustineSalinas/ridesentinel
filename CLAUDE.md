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

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
