# RideSentinel

Mobile-first PWA so two people meeting for an informal motorcycle ride can check who they're meeting, with reputation built only from confirmed meetings. See **[docs/SPEC.md](docs/SPEC.md)** for the full spec — product rules, domain model, RLS policy, Edge Function contracts, routes, and the build plan. Decisions made while building are logged in **[docs/DECISIONS.md](docs/DECISIONS.md)**.

A clickable design prototype of every screen is linked from `docs/SPEC.md` §18.

## Stack

React + Vite (TS) · Tailwind CSS v4 · React Router · TanStack Query · React Hook Form + Zod · Supabase (Auth/Postgres/Storage/Realtime/Edge Functions) · Vercel hosting. See `docs/SPEC.md` §2 for the fixed list — don't add dependencies without a reason in the PR.

## Getting started

```bash
pnpm install
cp .env.example .env.local   # fill in VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
pnpm dev
```

### Local Supabase (from M1 onward)

```bash
supabase start
supabase db reset     # applies supabase/migrations/* + supabase/seed.sql
supabase test db      # pgTAP RLS/policy tests
```

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Vite dev server |
| `pnpm build` | Typecheck + production build |
| `pnpm typecheck` | `tsc -b --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier, writes in place |
| `pnpm test` | Vitest (unit/component) |
| `pnpm test:e2e` | Playwright (two-browser-context flows) |

## Status

Currently at **M0 — Foundations** (see `docs/SPEC.md` §14): repo scaffold, routing skeleton, CI, PWA shell. No feature logic yet — every route renders a placeholder naming the milestone that implements it.
