# RideSentinel

Mobile-first PWA so two people meeting for an informal motorcycle ride can check who they're meeting, with reputation built only from confirmed meetings. See **[docs/SPEC.md](docs/SPEC.md)** for the full spec — product rules, domain model, authorization rules, backend function contracts, routes, and the build plan. Decisions made while building are logged in **[docs/DECISIONS.md](docs/DECISIONS.md)**.

A clickable design prototype of every screen is linked from `docs/SPEC.md` §18.

## Stack

React + Vite (TS) · Tailwind CSS v4 · React Router · TanStack Query · React Hook Form + Zod · **Convex** (database, reactive queries/mutations, Convex Auth, file storage, scheduled functions) · Vercel hosting (front end). See `docs/SPEC.md` §2 for the fixed list — don't add dependencies without a reason in the PR.

Convex has **no Row-Level Security** — authorization is hand-written in `convex/lib/authz.ts` and called explicitly by every function. See `docs/SPEC.md` §5 before adding a new query or mutation.

## Getting started

```bash
pnpm install
npx convex dev   # interactive, one-time: opens a browser login, creates convex/_generated/*
                  # and writes VITE_CONVEX_URL to .env.local — leave it running in a terminal
pnpm dev          # in a second terminal
```

> `pnpm typecheck` / `pnpm build` will fail with "Cannot find module '../../convex/_generated/api'" until `npx convex dev` has run at least once — that folder is gitignored and generated on demand, same as any other codegen output.

## Scripts

| Command | What it does |
|---|---|
| `npx convex dev` | Convex dev deployment — watches `convex/*.ts`, regenerates types |
| `pnpm dev` | Vite dev server |
| `pnpm build` | Typecheck + production build |
| `pnpm typecheck` | `tsc -b --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier, writes in place |
| `pnpm test` | Vitest (unit/component) |
| `pnpm test:convex` | `convex-test` backend authorization/replay tests |
| `pnpm test:e2e` | Playwright — needs `npx convex dev` running in another terminal first |

## CI

GitHub Actions needs a `CONVEX_DEPLOY_KEY` repo secret (Convex dashboard → Settings → Deploy keys) and a `VITE_CONVEX_URL` secret before lint/typecheck/build will pass there — see `.github/workflows/ci.yml`.

## Status

M0–M4 are fully built: accounts, profile (incl. account deletion with rating anonymization), consent, ID verification + admin review, the QR handshake (issue/scan/confirm, replay-protected), ratings (blind reveal, anti-abuse), reports, and admin moderation + audit log, plus a pilot-metrics panel on the admin dashboard. No screen in `docs/SPEC.md` §7 is still a placeholder.

Verified via `gstack /qa` (real browser testing against the running app) and `pnpm test:e2e` (`e2e/full-ride.spec.ts` drives three browser contexts — admin + two riders — through the whole critical path, including replay rejection). `pnpm test:convex` covers backend authorization directly.

**Bootstrapping an admin** (there's no self-promotion by design):
```bash
npx convex run admin:makeAdmin '{"displayName":"Your Name"}'
```

On **Windows PowerShell**, the above is unreliable — PowerShell 5.1 strips embedded double
quotes from arguments passed to native executables no matter how you escape them. Use the
bundled helper instead, which spawns `node` directly with an argv array and sidesteps the
problem entirely:
```powershell
node scripts\make-admin.mjs "Your Name"
```

**Still needs a human:** a `CONVEX_DEPLOY_KEY` for Vercel/CI to actually deploy, a real device/browser pass on your end, and the `docs/SPEC.md` §17 decisions (pilot community name, data protection contact, final branding).
