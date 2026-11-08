# Decisions log

Running log of choices made while building, per `docs/SPEC.md` Section 0 rule 8: when a requirement is ambiguous, pick the safest option, log it here, and continue.

| Date | Area | Decision | Why |
|---|---|---|---|
| 2026-11-08 | Tooling | Package manager is `pnpm` | Spec Section 2 decision; faster installs, strict node_modules |
| 2026-11-08 | Tooling | Tailwind CSS v4 via `@tailwindcss/vite` plugin (CSS-first config, no `tailwind.config.js`) | Current stable Tailwind major; spec only pins "Tailwind CSS", not a version |
| 2026-11-08 | Tooling | ESLint (flat config) + Prettier for formatting, oxlint removed | Spec CI requires "lint, typecheck" via standard ESLint; oxlint was Vite's scaffold default but not part of the fixed stack |
| 2026-11-08 | PWA | `public/icon-192.png` / `icon-512.png` are solid-color placeholders (brand blue), not a real app icon | Unblocks the PWA manifest in M0; swap for real artwork once branding (Section 17 open item 5) is settled |
| 2026-11-08 | Tooling | Pinned `typescript` to `^5.9.3` instead of the newly-released TS 7 | `typescript-eslint` 8.x does not yet support the TS 7 API; revisit once typescript-eslint adds support |
| 2026-11-08 | Backend | Switched the entire backend from Supabase (Postgres+RLS+Edge Functions) to Convex, at the user's explicit request after a tradeoffs discussion | Convex has no RLS — authorization now lives entirely in `convex/lib/authz.ts` helpers that every query/mutation must call by hand (see `convex/schema.ts` header comment). Sections 2–6 and 12 of `docs/SPEC.md` were rewritten accordingly; pgTAP policy tests are replaced by `convex-test` unit tests (not yet written — M1 follow-up) |
| 2026-11-08 | Backend | QR tokens no longer need HMAC signing | Since only our own `issueQr`/`scanQr` mutations can ever create or consume a `qrTokens` row, Convex's server-trust boundary already gives the "server decides what is true" guarantee the SQL version got from a signed, client-opaque token |
| 2026-11-08 | Backend | **Blocker, needs the user**: `convex/_generated/*` cannot be produced from this sandbox — `npx convex dev` requires an interactive browser login, and `npx convex codegen` still needs a real `CONVEX_DEPLOYMENT` to resolve against (confirmed: a placeholder deployment name is rejected by `api.convex.dev`) | Until someone runs `npx convex login && npx convex dev` locally once, `pnpm typecheck`/`pnpm build`/CI will fail on the `../../convex/_generated/api` imports in `src/`. This is expected, not a bug — `convex/_generated` is gitignored like `node_modules`, the same as the Supabase-generated types were before it |
