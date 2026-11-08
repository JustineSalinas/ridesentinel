# RideSentinel

Read `docs/SPEC.md` before any task. Follow its rules, build order (Section 14), and definition of done (Section 16). Log any ambiguous call in `docs/DECISIONS.md`.

Quick commands:
- `pnpm dev` — start the Vite dev server
- `pnpm build` — typecheck + production build
- `pnpm lint` — ESLint
- `pnpm test` — Vitest unit/component tests
- `pnpm test:e2e` — Playwright e2e (requires the dev server and a Supabase local stack)
- `supabase start` / `supabase db reset` — local Supabase stack and migrations
- `supabase test db` — pgTAP RLS/policy tests
