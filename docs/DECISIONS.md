# Decisions log

Running log of choices made while building, per `docs/SPEC.md` Section 0 rule 8: when a requirement is ambiguous, pick the safest option, log it here, and continue.

| Date | Area | Decision | Why |
|---|---|---|---|
| 2026-11-08 | Tooling | Package manager is `pnpm` | Spec Section 2 decision; faster installs, strict node_modules |
| 2026-11-08 | Tooling | Tailwind CSS v4 via `@tailwindcss/vite` plugin (CSS-first config, no `tailwind.config.js`) | Current stable Tailwind major; spec only pins "Tailwind CSS", not a version |
| 2026-11-08 | Tooling | ESLint (flat config) + Prettier for formatting, oxlint removed | Spec CI requires "lint, typecheck" via standard ESLint; oxlint was Vite's scaffold default but not part of the fixed stack |
| 2026-11-08 | PWA | `public/icon-192.png` / `icon-512.png` are solid-color placeholders (brand blue), not a real app icon | Unblocks the PWA manifest in M0; swap for real artwork once branding (Section 17 open item 5) is settled |
| 2026-11-08 | Tooling | Pinned `typescript` to `^5.9.3` instead of the newly-released TS 7 | `typescript-eslint` 8.x does not yet support the TS 7 API; revisit once typescript-eslint adds support |
